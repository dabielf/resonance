import { createFileRoute } from '@tanstack/react-router'
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "@/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute('/app/yolo')({
  component: Yolo,
})


export default function Yolo() {
    const [isLoading, setIsLoading] = useState(false);
    const [topic, setTopic] = useState('');
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const generateContentMutation = useMutation(
    trpc.gwRouter.generateContent.mutationOptions({
      onSuccess(data) {
        setIsLoading(false);
        setContent(data.response);
      },
      onError(error) {
        setIsLoading(false);
        setError(error.message);
      },
    }),
  );

  const handleGenerateContent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    generateContentMutation.mutate({ topic });
  };

  return (

        <div>
          <form onSubmit={handleGenerateContent} className="flex flex-col gap-4">
            <Input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic"
            />
            <Button type="submit">Generate Content</Button>
          </form>
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <span className="ml-2">Loading data...</span>
                </div>
              ) : error ? (
                <div className="m-4 rounded-md bg-red-50 p-4 text-red-700">
                  <p className="font-medium">Error loading data</p>
                  <p>
                    There was a problem fetching the table data. We'll
                    automatically retry soon.
                  </p>
                  <div className="mt-2 flex items-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-700 border-t-transparent"></div>
                    <span className="ml-2 text-sm">Retrying...</span>
                  </div>
                </div>
              ) : (
                content && <Textarea value={content} />
              )}
            </div>
          </div>
        </div>
  )

}