import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Send, Bot, User, Sparkles } from 'lucide-react-native';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your AI life coach. I'm here to help you reflect, set goals, and make progress on your journey. What's on your mind today?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response with a delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAiResponse(inputText),
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAiResponse = (userInput: string): string => {
    const responses = [
      "That's a great insight. Can you tell me more about what led you to that realization?",
      "I hear you. It sounds like you're processing something important. How does that make you feel?",
      "That's really thoughtful. What do you think would be a good next step?",
      "I appreciate you sharing that with me. What patterns do you notice in your thinking about this?",
      "That sounds challenging. What resources or strengths do you have that might help?",
      "Interesting perspective. How does this connect to your broader goals?",
      "Thank you for being so open. What would success look like to you in this situation?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessageContainer : styles.aiMessageContainer
    ]}>
      {!item.isUser && (
        <View style={styles.aiAvatar}>
          <Bot size={16} color="#3B82F6" />
        </View>
      )}
      
      <View style={[
        styles.messageBubble,
        item.isUser ? styles.userMessageBubble : styles.aiMessageBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.isUser ? styles.userMessageText : styles.aiMessageText
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.timestampText,
          item.isUser ? styles.userTimestampText : styles.aiTimestampText
        ]}>
          {format(item.timestamp, 'HH:mm')}
        </Text>
      </View>

      {item.isUser && (
        <View style={styles.userAvatar}>
          <User size={16} color="#F59E0B" />
        </View>
      )}
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={styles.typingContainer}>
      <View style={styles.aiAvatar}>
        <Bot size={16} color="#3B82F6" />
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingContent}>
          <Text style={styles.typingText}>Thinking</Text>
          <Sparkles size={16} color="#6B7280" />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
        <Text style={styles.headerSubtitle}>Your AI Life Coach</Text>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={isTyping ? renderTypingIndicator : null}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <View style={styles.textInputContainer}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Share what's on your mind..."
                placeholderTextColor="#9CA3AF"
                multiline
                style={styles.textInput}
                onSubmitEditing={sendMessage}
                blurOnSubmit={false}
              />
            </View>
            
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim() || isTyping}
              style={[
                styles.sendButton,
                (inputText.trim() && !isTyping) ? styles.sendButtonActive : styles.sendButtonInactive
              ]}
            >
              <Send 
                size={20} 
                color={inputText.trim() && !isTyping ? '#FFFFFF' : '#9CA3AF'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessageBubble: {
    backgroundColor: '#3B82F6',
    marginLeft: 16,
  },
  aiMessageBubble: {
    backgroundColor: '#F3F4F6',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#1F2937',
  },
  timestampText: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.7,
  },
  userTimestampText: {
    color: '#FFFFFF',
  },
  aiTimestampText: {
    color: '#1F2937',
  },
  typingContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 16,
  },
  typingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    color: '#1F2937',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInputContainer: {
    flex: 1,
    minHeight: 44,
    maxHeight: 128,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#3B82F6',
  },
  sendButtonInactive: {
    backgroundColor: '#D1D5DB',
  },
});
