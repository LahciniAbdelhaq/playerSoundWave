import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePlaylistDto {
  @ApiProperty({ example: 'Late Night Drive' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdatePlaylistDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class AddSongDto {
  @ApiProperty()
  @IsString()
  songId: string;
}

export class ReorderDto {
  @ApiProperty({ type: [String], description: 'songIds in the desired order' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  songIds: string[];
}
