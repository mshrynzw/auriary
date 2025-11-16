import { z } from 'zod';
import { commonColumnsSchema, diaryIdSchema } from '../base';

/**
 * t_diary_attachments（日記添付）のデータベース行スキーマ
 */
export const diaryAttachmentRowSchema = commonColumnsSchema.extend({
  diary_id: diaryIdSchema,
  file_path: z.string(),
  file_type: z.string(),
  file_size: z.number().int().positive().nullable(),
  thumbnail_path: z.string().nullable(),
});

/**
 * t_diary_attachments（日記添付）のアプリケーション用スキーマ
 */
export const diaryAttachmentSchema = diaryAttachmentRowSchema;

export type DiaryAttachment = z.infer<typeof diaryAttachmentSchema>;
export type DiaryAttachmentRow = z.infer<typeof diaryAttachmentRowSchema>;

