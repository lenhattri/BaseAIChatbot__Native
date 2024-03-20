import { useState, useEffect } from "react";
import { OpenAI } from "openai";

const openai_api_key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const assistant_id = process.env.EXPO_PUBLIC_ASSISTANT_ID;
console.log(openai_api_key);
console.log(assistant_id);

const useGptGenerater = () => {
  const [openaiClient, setOpenaiClient] = useState(null);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [messages, setMessages] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const createOpenaiClient = async () => {
      if (!openai_api_key) {
        setError("Missing EXPO_PUBLIC_OPENAI_API_KEY environment variable");
        return;
      }

      try {
        const client = new OpenAI({ apiKey: openai_api_key });
        setOpenaiClient(client);
      } catch (err) {
        setError(err);
        console.log(err);
      }
    };

    createOpenaiClient();
  }, []);

  const createThread = async () => {
    if (!openaiClient) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { id: threadId } = await openaiClient.beta.threads.create({
        messages: [
          {
            role: "system",
            content:
              "Trợ lý là một chuyên gia về công tác khuyến nông cho các nông dân tại Việt Nam. Nhiệm vụ của trợ lý là trả lời các câu hỏi liên quan đến công tác khuyến nông",
          },
        ],
      });
      setCurrentThreadId(threadId);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const continueConversation = async (newMessage) => {
    if (!currentThreadId || !openaiClient) {
      console.log("Hello");
      return;
    }
    const assistant = await openaiClient.beta.assistants.retrieve(assistant_id);
    setIsLoading(true);
    setError(null);

    try {
      await openaiClient.beta.threads.messages.create(currentThreadId, {
        role: "user",
        content: newMessage,
      });

      console.log("Hello");
      const { id: runId } = await openaiClient.beta.threads.runs.create(
        currentThreadId,
        {
          assistant_id: assistant.id,
        }
      );

      await new Promise((resolve) => {
        const checkStatus = async () => {
          const { status } = await openaiClient.beta.threads.runs.retrieve(
            currentThreadId,
            runId
          );

          if (status === "completed") {
            resolve();
          } else {
            const newMessages = await openaiClient.beta.threads.messages.list(
              currentThreadId
            );
            console.log("almost");
            newMessages.body.data.map((message) => {
              console.log(message.content[0].text.value);
            });
          }
        };

        checkStatus();
      });
    } catch (err) {
      setError(err);
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchThread = async () => {
    setCurrentThreadId(null);
    setMessages([]);
    createThread();
  };

  return {
    currentThreadId,
    messages,
    isLoading,
    error,
    createThread,
    continueConversation,
    switchThread,
  };
};

export default useGptGenerater;