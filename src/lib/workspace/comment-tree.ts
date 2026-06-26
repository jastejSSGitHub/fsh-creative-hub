import type { CommentWithAuthor } from "@/lib/workspace/queries";

export function removeCommentFromTree(
  comments: CommentWithAuthor[],
  commentId: string,
): CommentWithAuthor[] {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies.filter((reply) => reply.id !== commentId),
    }));
}

export function restoreCommentToTree(
  comments: CommentWithAuthor[],
  comment: CommentWithAuthor,
): CommentWithAuthor[] {
  if (!comment.parent_id) {
    return [...comments, comment].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }

  return comments.map((parent) => {
    if (parent.id !== comment.parent_id) return parent;

    return {
      ...parent,
      replies: [...parent.replies, comment].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    };
  });
}
