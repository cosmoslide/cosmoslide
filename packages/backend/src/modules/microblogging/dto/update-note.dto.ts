import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  contentWarning?: string;

  @IsOptional()
  @IsEnum(['public', 'unlisted', 'followers', 'direct'])
  visibility?: 'public' | 'unlisted' | 'followers' | 'direct';

  @IsOptional()
  @IsBoolean()
  sensitive?: boolean;

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

  @IsOptional()
  @IsArray()
  tags?: Array<{
    type: string;
    name: string;
    href?: string;
  }>;

  @IsOptional()
  @IsArray()
  mentions?: Array<{
    type: string;
    href: string;
    name: string;
  }>;
}
