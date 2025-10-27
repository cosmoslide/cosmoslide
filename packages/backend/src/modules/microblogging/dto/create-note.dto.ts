import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateNoteDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  contentWarning?: string;

  @IsOptional()
  @IsEnum(['public', 'unlisted', 'followers', 'direct'])
  visibility?: 'public' | 'unlisted' | 'followers' | 'direct' = 'public';

  @IsOptional()
  @IsBoolean()
  sensitive?: boolean = false;

  @IsOptional()
  @IsString()
  inReplyToId?: string;

  @IsOptional()
  @IsArray()
  attachments?: Array<{
    type: string;
    url: string;
    mediaType: string;
    name?: string;
  }>;
}
