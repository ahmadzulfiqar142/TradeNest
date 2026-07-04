export interface Topic {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  replies: number;
  productId: string;
}

export interface Reply {
  id: string;
  topicId: string;
  content: string;
  author: string;
  createdAt: string;
}

// Mock data for forum topics
const mockTopics: Topic[] = [
  {
    id: "1",
    title: "Best practices for Wireless Headphones maintenance",
    content: "What are the best ways to maintain wireless headphones?",
    author: "John Doe",
    createdAt: "2024-01-15T10:00:00Z",
    replies: 5,
    productId: "1",
  },
  {
    id: "2",
    title: "USB-C Cable compatibility questions",
    content: "Are these cables compatible with all USB-C devices?",
    author: "Jane Smith",
    createdAt: "2024-01-14T14:30:00Z",
    replies: 3,
    productId: "2",
  },
  {
    id: "3",
    title: "Laptop Stand assembly instructions",
    content: "Can someone share assembly instructions for the laptop stand?",
    author: "Mike Johnson",
    createdAt: "2024-01-13T09:15:00Z",
    replies: 8,
    productId: "3",
  },
];

export function getTopicsByProduct(productId: string): Topic[] {
  return mockTopics.filter((topic) => topic.productId === productId);
}

export function getTopicById(topicId: string): Topic | undefined {
  return mockTopics.find((topic) => topic.id === topicId);
}

export function createTopic(
  topic: Omit<Topic, "id" | "createdAt" | "replies">,
): Topic {
  const newTopic: Topic = {
    ...topic,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    replies: 0,
  };
  mockTopics.push(newTopic);
  return newTopic;
}

export function getRepliesByTopic(topicId: string): Reply[] {
  // Mock replies - in a real app, this would fetch from a database
  return [];
}

export function createReply(reply: Omit<Reply, "id" | "createdAt">): Reply {
  const newReply: Reply = {
    ...reply,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  return newReply;
}
