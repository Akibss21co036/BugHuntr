"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, limit } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CommunityChatPage() {
  const params = useParams<{ id: string }>();
  const id = useMemo(() => String(params?.id ?? ""), [params?.id]);
  const { user, isLoading: authLoading } = useAuth();
  const [communityName, setCommunityName] = useState(id);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; senderId: string }>>([]);
  const [messageText, setMessageText] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log(params?.id);
  }, [params?.id]);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const communityRef = doc(db, "communities", id);
    const unsubscribe = onSnapshot(communityRef, (snapshot) => {
      if (!snapshot.exists()) {
        setCommunityName(id);
        setIsLoading(false);
        return;
      }

      const data = snapshot.data() as { name?: string };
      setCommunityName(data.name ?? id);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!id || !user?.id) {
      setIsMember(false);
      return;
    }

    const memberRef = doc(db, "communities", id, "members", user.id);
    const unsubscribe = onSnapshot(memberRef, (snapshot) => {
      setIsMember(snapshot.exists());
    });

    return () => unsubscribe();
  }, [id, user?.id]);

  useEffect(() => {
    if (!id) return;

    const messagesQuery = query(
      collection(db, "communities", id, "messages"),
      orderBy("createdAt", "asc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(
        snapshot.docs.map((messageDoc) => ({
          id: messageDoc.id,
          ...(messageDoc.data() as { text: string; senderId: string }),
        })),
      );
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !id || !user?.id || !isMember) return;

    await addDoc(collection(db, "communities", id, "messages"), {
      text,
      senderId: user.id,
      createdAt: serverTimestamp(),
    });

    setMessageText("");
  };

  const isDisabled = authLoading || isLoading || !isMember || !messageText.trim();

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)] bg-background">
      <div className="border-b border-border px-4 md:px-6 py-3">
        <h1 className="text-base md:text-lg font-semibold truncate">{communityName}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3 overscroll-contain">
        {!isLoading && messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === user?.id;

            return (
              <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] sm:max-w-[80%] lg:max-w-[72%] rounded-lg border px-3 py-2 text-sm md:text-base ${isOwnMessage ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>
                  <p className="break-words whitespace-pre-wrap">{message.text}</p>
                  <p className={`mt-1 text-xs ${isOwnMessage ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {isOwnMessage ? "You" : message.senderId}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 p-3 md:p-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        {!isMember ? (
          <p className="text-sm text-muted-foreground">Join community to chat</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <Button onClick={() => void handleSend()} disabled={isDisabled} className="w-full sm:w-auto">
              Send
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}