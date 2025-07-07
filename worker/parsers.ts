// Parser utilities optimized for Cloudflare Workers with nodejs_compat

// EPUB to String Converter - Optimized for Cloudflare Workers
// Dynamic import for better code splitting

/**
 * EPUB to string converter optimized for Cloudflare Workers
 * @param epubFile - The EPUB file as a File, Blob, or ArrayBuffer
 * @returns A promise that resolves to a trimmed string containing all text from the EPUB
 */
export async function epubToString(
	epubFile: File | Blob | ArrayBuffer,
): Promise<string> {
	console.log("[EPUB] Starting EPUB processing...");
	const startTime = performance.now();

	try {
		// Handle different file input types (including serialized File objects from TRPC)
		let buffer: ArrayBuffer;
		let fileSize: number;

		if (epubFile instanceof ArrayBuffer) {
			buffer = epubFile;
			fileSize = epubFile.byteLength;
		} else if (epubFile instanceof File || epubFile instanceof Blob) {
			buffer = await epubFile.arrayBuffer();
			fileSize = epubFile.size;
		} else if (epubFile && typeof epubFile === 'object' && epubFile.data) {
			// Handle serialized File object from TRPC
			if (epubFile.data instanceof ArrayBuffer) {
				buffer = epubFile.data;
				fileSize = epubFile.data.byteLength;
			} else if (Array.isArray(epubFile.data)) {
				buffer = new Uint8Array(epubFile.data).buffer;
				fileSize = epubFile.data.length;
			} else {
				throw new Error("Invalid file data format");
			}
		} else if (epubFile && typeof epubFile === 'object' && epubFile.buffer) {
			// Handle Buffer-like objects
			buffer = epubFile.buffer instanceof ArrayBuffer ? epubFile.buffer : epubFile.buffer.buffer;
			fileSize = epubFile.buffer.byteLength || epubFile.buffer.length;
		} else {
			throw new Error("Unsupported file format. Please upload a valid EPUB file.");
		}

		console.log(`[EPUB] File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

		// Load the EPUB file as a ZIP
		console.log("[EPUB] Loading ZIP archive...");
		const zipStartTime = performance.now();
		
		// Dynamic import for better code splitting
		const JSZip = (await import("jszip")).default;
		const zip = await JSZip.loadAsync(buffer);
		console.log(
			`[EPUB] ZIP loaded in ${(performance.now() - zipStartTime).toFixed(2)}ms`,
		);

		// Find and read the container.xml
		const containerXml = await zip
			.file("META-INF/container.xml")
			?.async("string");
		if (!containerXml) {
			throw new Error("Invalid EPUB: container.xml not found");
		}

		// Extract OPF path using regex
		const opfPath = containerXml.match(/full-path="([^"]+)"/)?.[1];
		if (!opfPath) {
			throw new Error("OPF path not found");
		}
		console.log(`[EPUB] OPF path: ${opfPath}`);

		// Read the OPF file
		const opfContent = await zip.file(opfPath)?.async("string");
		if (!opfContent) {
			throw new Error("Invalid EPUB: OPF file not found");
		}

		// Debug: Show first 500 chars of OPF
		console.log(
			`[EPUB] OPF content preview: ${opfContent.substring(0, 500)}...`,
		);

		// Get the base directory
		const opfDir = opfPath.substring(0, opfPath.lastIndexOf("/") + 1);

		// Parse manifest - handle namespaces and flexible attribute order
		const manifestMap = new Map<string, { href: string; mediaType?: string }>();

		// First, check if we have a manifest element
		const manifestSection = opfContent.match(
			/<manifest[^>]*>([\s\S]*?)<\/manifest>/i,
		)?.[1];
		if (!manifestSection) {
			console.log("[EPUB] Warning: No manifest section found");
		} else {
			console.log("[EPUB] Manifest section found, parsing items...");

			// More flexible regex that handles various attribute orders and namespaces
			const itemRegex = /<item\b[^>]*>/gi;
			const items = manifestSection.match(itemRegex) || [];

			for (const item of items) {
				// Extract attributes
				const idMatch = item.match(/\bid\s*=\s*["']([^"']+)["']/i);
				const hrefMatch = item.match(/\bhref\s*=\s*["']([^"']+)["']/i);
				const mediaTypeMatch = item.match(
					/\bmedia-type\s*=\s*["']([^"']+)["']/i,
				);

				if (idMatch && idMatch[1] && hrefMatch && hrefMatch[1]) {
					const id = idMatch[1];
					const href = hrefMatch[1];
					const mediaType = mediaTypeMatch?.[1];
					manifestMap.set(id, { href, mediaType });
					console.log(
						`[EPUB] Manifest item: ${id} -> ${href} (${mediaType || "no media-type"})`,
					);
				}
			}
		}

		console.log(`[EPUB] Total manifest items: ${manifestMap.size}`);

		// Get spine items
		const spineItems: string[] = [];
		const spineSection = opfContent.match(
			/<spine[^>]*>([\s\S]*?)<\/spine>/i,
		)?.[1];

		if (!spineSection) {
			console.log("[EPUB] Warning: No spine section found");
		} else {
			console.log("[EPUB] Spine section found, parsing itemrefs...");

			const itemrefRegex = /<itemref\b[^>]*>/gi;
			const itemrefs = spineSection.match(itemrefRegex) || [];

			for (const itemref of itemrefs) {
				const idrefMatch = itemref.match(/\bidref\s*=\s*["']([^"']+)["']/i);
				if (idrefMatch && idrefMatch[1]) {
					const idref = idrefMatch[1];
					const manifestItem = manifestMap.get(idref);
					if (manifestItem) {
						const fullPath = opfDir + manifestItem.href;
						spineItems.push(fullPath);
						console.log(`[EPUB] Spine item: ${idref} -> ${fullPath}`);
					}
				}
			}
		}

		// If no spine items found, try to get all HTML/XHTML files from manifest
		if (spineItems.length === 0) {
			console.log(
				"[EPUB] No spine items found, trying all HTML/XML content from manifest...",
			);
			for (const [id, item] of manifestMap.entries()) {
				// Check by media-type or file extension
				const isContent =
					item.mediaType?.includes("html") ||
					item.mediaType?.includes("xml") ||
					item.href.match(/\.(x?html?|xml|htm)$/i);
				if (isContent) {
					const fullPath = opfDir + item.href;
					spineItems.push(fullPath);
					console.log(`[EPUB] Adding content file: ${id} -> ${fullPath}`);
				}
			}
		}

		console.log(`[EPUB] Found ${spineItems.length} content files`);

		// Process files in parallel with batching for Workers memory limits
		const BATCH_SIZE = 20; // Process 20 files at a time to avoid memory issues
		const allResults: { text: string; order: number }[] = [];

		for (let i = 0; i < spineItems.length; i += BATCH_SIZE) {
			const batch = spineItems.slice(i, i + BATCH_SIZE);
			const batchPromises = batch.map(async (contentPath, batchIndex) => {
				const content = await zip.file(contentPath)?.async("string");
				if (content) {
					const text = fastExtractText(content);
					const order = i + batchIndex;
					console.log(
						`[EPUB] Processed ${order + 1}/${spineItems.length}: ${contentPath}`,
					);
					return { text, order };
				}
				return { text: "", order: i + batchIndex };
			});

			const batchResults = await Promise.all(batchPromises);
			allResults.push(...batchResults);
		}

		// Sort and join
		allResults.sort((a, b) => a.order - b.order);
		const fullText = allResults.map((item) => item.text).join("\n\n");

		// Efficient cleanup
		const cleanedText = fullText
			.replace(/\s+/g, " ")
			.replace(/\n{3,}/g, "\n\n")
			.trim();

		const totalTime = performance.now() - startTime;
		console.log(
			`[EPUB] ✅ Complete! ${cleanedText.length} chars in ${(totalTime / 1000).toFixed(2)}s`,
		);

		return cleanedText;
	} catch (error) {
		console.error("[EPUB] ❌ Error:", error);
		throw new Error(
			`Failed to process EPUB: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Fast text extraction optimized for Workers
 */
function fastExtractText(html: string): string {
	return html
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ")
		.trim();
}

// PDF to String Converter - Using unpdf for Cloudflare Workers
// Dynamic import for better code splitting

/**
 * PDF to string converter using unpdf
 * @param pdfFile - The PDF file as a File, Blob, or ArrayBuffer
 * @returns A promise that resolves to a trimmed string
 */
export async function pdfToString(
	pdfFile: File | Blob | ArrayBuffer,
): Promise<string> {
	console.log("[PDF] Starting PDF processing...");
	const startTime = performance.now();

	try {
		// Handle different file input types (including serialized File objects from TRPC)
		let data: Uint8Array;
		let fileSize: number;

		if (pdfFile instanceof ArrayBuffer) {
			data = new Uint8Array(pdfFile);
			fileSize = pdfFile.byteLength;
		} else if (pdfFile instanceof Uint8Array) {
			data = pdfFile;
			fileSize = pdfFile.byteLength;
		} else if (pdfFile instanceof File || pdfFile instanceof Blob) {
			const buffer = await pdfFile.arrayBuffer();
			data = new Uint8Array(buffer);
			fileSize = pdfFile.size;
		} else if (pdfFile && typeof pdfFile === 'object' && pdfFile.data) {
			// Handle serialized File object from TRPC
			if (pdfFile.data instanceof ArrayBuffer) {
				data = new Uint8Array(pdfFile.data);
				fileSize = pdfFile.data.byteLength;
			} else if (Array.isArray(pdfFile.data)) {
				data = new Uint8Array(pdfFile.data);
				fileSize = pdfFile.data.length;
			} else {
				throw new Error("Invalid file data format");
			}
		} else if (pdfFile && typeof pdfFile === 'object' && pdfFile.buffer) {
			// Handle Buffer-like objects
			data = new Uint8Array(pdfFile.buffer);
			fileSize = pdfFile.buffer.byteLength || pdfFile.buffer.length;
		} else {
			throw new Error("Unsupported file format. Please upload a valid PDF file.");
		}

		console.log(`[PDF] File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

		// Parse PDF
		console.log("[PDF] Loading PDF document...");
		const parseStartTime = performance.now();

		// Dynamic import for better code splitting
		const { extractText, getDocumentProxy } = await import("unpdf");

		// Load the PDF using unpdf
		const pdf = await getDocumentProxy(data);
		console.log(
			`[PDF] Document loaded in ${(performance.now() - parseStartTime).toFixed(2)}ms`,
		);

		// Extract text from all pages
		console.log("[PDF] Extracting text from PDF...");
		const extractStartTime = performance.now();
		const { totalPages, text } = await extractText(pdf, { mergePages: true });
		console.log(
			`[PDF] Text extracted in ${(performance.now() - extractStartTime).toFixed(2)}ms`,
		);
		console.log(`[PDF] Total pages: ${totalPages}`);
		console.log(`[PDF] Raw text length: ${text.length} characters`);

		// Clean up the text
		console.log("[PDF] Cleaning up text...");
		const cleanedText = text
			.replace(/[\u00A0\u2000-\u200B]/g, " ") // Various space chars
			.replace(/\s+/g, " ") // Multiple spaces
			.replace(/(\w)-\s*\n\s*(\w)/g, "$1$2") // Hyphenated words
			.replace(/\n{3,}/g, "\n\n") // Multiple newlines
			.trim();

		const totalTime = performance.now() - startTime;
		console.log(
			`[PDF] ✅ Complete! ${cleanedText.length} chars in ${(totalTime / 1000).toFixed(2)}s`,
		);

		return cleanedText;
	} catch (error) {
		console.error("[PDF] ❌ Error:", error);
		throw new Error(
			`Failed to process PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Alternative: Simple PDF text extraction without dependencies
 * Works for most PDFs without complex encoding
 */
export async function pdfToStringSimple(
	pdfFile: File | Blob | ArrayBuffer,
): Promise<string> {
	console.log("[PDF-Simple] Starting dependency-free PDF extraction...");
	const startTime = performance.now();

	try {
		// Handle different file input types (including serialized File objects from TRPC)
		let buffer: ArrayBuffer;
		let fileSize: number;

		if (pdfFile instanceof ArrayBuffer) {
			buffer = pdfFile;
			fileSize = pdfFile.byteLength;
		} else if (pdfFile instanceof File || pdfFile instanceof Blob) {
			buffer = await pdfFile.arrayBuffer();
			fileSize = pdfFile.size;
		} else if (pdfFile && typeof pdfFile === 'object' && pdfFile.data) {
			// Handle serialized File object from TRPC
			if (pdfFile.data instanceof ArrayBuffer) {
				buffer = pdfFile.data;
				fileSize = pdfFile.data.byteLength;
			} else if (Array.isArray(pdfFile.data)) {
				buffer = new Uint8Array(pdfFile.data).buffer;
				fileSize = pdfFile.data.length;
			} else {
				throw new Error("Invalid file data format");
			}
		} else if (pdfFile && typeof pdfFile === 'object' && pdfFile.buffer) {
			// Handle Buffer-like objects
			buffer = pdfFile.buffer instanceof ArrayBuffer ? pdfFile.buffer : pdfFile.buffer.buffer;
			fileSize = pdfFile.buffer.byteLength || pdfFile.buffer.length;
		} else {
			throw new Error("Unsupported file format. Please upload a valid PDF file.");
		}

		console.log(
			`[PDF-Simple] File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`,
		);

		const bytes = new Uint8Array(buffer);
		const decoder = new TextDecoder("utf-8");
		const content = decoder.decode(bytes);

		console.log("[PDF-Simple] Extracting text content...");

		// Method 1: Extract text between BT/ET markers
		const textParts: string[] = [];

		// Find all text objects
		const streamMatches = content.matchAll(/stream\s*\n([\s\S]*?)\nendstream/g);
		for (const match of streamMatches) {
			const stream = match[1];
			if (!stream) continue;

			// Extract text from Tj operators
			const tjMatches = stream.matchAll(/\(((?:[^()\\]|\\[\\()\n])*)\)\s*Tj/g);
			for (const tjMatch of tjMatches) {
				if (!tjMatch[1]) continue;
				const text = decodePdfString(tjMatch[1]);
				if (text.trim()) {
					textParts.push(text);
				}
			}

			// Extract text from TJ operators (text arrays)
			const tjArrayMatches = stream.matchAll(/\[(.*?)\]\s*TJ/g);
			for (const tjArrayMatch of tjArrayMatches) {
				const arrayContent = tjArrayMatch[1];
				if (!arrayContent) continue;
				const stringMatches = arrayContent.matchAll(
					/\(((?:[^()\\]|\\[\\()\n])*)\)/g,
				);
				for (const stringMatch of stringMatches) {
					if (!stringMatch[1]) continue;
					const text = decodePdfString(stringMatch[1]);
					if (text.trim()) {
						textParts.push(text);
					}
				}
			}
		}

		// Join and clean text
		const text = textParts
			.join(" ")
			.replace(/\s+/g, " ")
			.replace(/(\w)-\s+(\w)/g, "$1$2") // Rejoin hyphenated words
			.trim();

		const totalTime = performance.now() - startTime;
		console.log(
			`[PDF-Simple] ✅ Complete! ${text.length} chars in ${(totalTime / 1000).toFixed(2)}s`,
		);

		return text;
	} catch (error) {
		console.error("[PDF-Simple] ❌ Error:", error);
		throw error;
	}
}

/**
 * Decode PDF string escapes
 */
function decodePdfString(str: string): string {
	return (
		str
			// Octal escapes
			.replace(/\\(\d{1,3})/g, (_, oct) => {
				const code = parseInt(oct, 8);
				return code <= 255 ? String.fromCharCode(code) : "";
			})
			// Named escapes
			.replace(/\\([nrtbf\\()\n])/g, (_, char) => {
				const escapes: Record<string, string> = {
					n: "\n",
					r: "\r",
					t: "\t",
					b: "\b",
					f: "\f",
					"\\": "\\",
					"(": "(",
					")": ")",
				};
				return escapes[char] || char;
			})
			// Remove any remaining backslashes
			.replace(/\\/g, "")
	);
}

// Export a universal PDF converter that tries multiple methods
export async function pdfToStringUniversal(
	pdfFile: File | Blob | ArrayBuffer,
): Promise<string> {
	try {
		// Try pdf-parse first if available
		return await pdfToString(pdfFile);
	} catch (error) {
		console.warn(
			"[PDF] pdf-parse failed, falling back to simple parser:",
			error,
		);
		// Fallback to simple parser
		return await pdfToStringSimple(pdfFile);
	}
}
