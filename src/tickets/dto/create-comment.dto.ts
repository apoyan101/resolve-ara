import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString({ message: 'author must be a string' })
  @IsNotEmpty({ message: 'author should not be empty' })
  author: string;

  @IsString({ message: 'body must be a string' })
  @IsNotEmpty({ message: 'body should not be empty' })
  body: string;

  @IsBoolean({ message: 'internal must be a boolean' })
  internal: boolean;
}
