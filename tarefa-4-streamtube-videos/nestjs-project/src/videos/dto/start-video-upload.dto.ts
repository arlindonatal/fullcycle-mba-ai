import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class StartVideoUploadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  content_type: string;

  @IsInt()
  @Min(1)
  size_bytes: number;
}
