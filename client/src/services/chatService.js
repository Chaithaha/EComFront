import supabase from "../utils/supabase";

export const chatService = {
  // Chat sessions
  async createChatSession(postId, sellerId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        post_id: postId,
        buyer_id: user.id,
        seller_id: sellerId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserChatSessions() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .select(
        `
        *,
        buyer:profiles!buyer_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        seller:profiles!seller_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        post:posts (
          id,
          title,
          image_url,
          price
        )
      `,
      )
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Messages
  async sendMessage(chatSessionId, content, messageType = "text") {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        chat_session_id: chatSessionId,
        sender_id: user.id,
        content,
        message_type: messageType,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getChatMessages(chatSessionId) {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        sender:profiles (
          id,
          username,
          full_name,
          avatar_url
        )
      `,
      )
      .eq("chat_session_id", chatSessionId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },

  // Real-time subscriptions
  subscribeToChat(chatSessionId, callback, statusCallback) {
    const channel = supabase
      .channel(`chat:${chatSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `chat_session_id=eq.${chatSessionId}`,
        },
        callback,
      )
      .subscribe((status) => {
        if (statusCallback) {
          // Map Supabase status to more readable format
          let readableStatus = status;
          if (status === "SUBSCRIBED") readableStatus = "OPEN";
          else if (status === "CHANNEL_ERROR") readableStatus = "ERROR";
          else if (status === "TIMED_OUT") readableStatus = "TIMED_OUT";
          statusCallback(readableStatus);
        }
      });

    return channel;
  },

  subscribeToChatSessions(callback) {
    return supabase
      .channel("chat_sessions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_sessions",
        },
        callback,
      )
      .subscribe();
  },
};
