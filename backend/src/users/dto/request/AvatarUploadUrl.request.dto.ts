import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AvatarUploadUrlDto {
  @ApiProperty({
    example: 'png',
    description: 'Dosya uzantısı',
  })
  @IsString()
  @IsNotEmpty()
  extension: string;
}