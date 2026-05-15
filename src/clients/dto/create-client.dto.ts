import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsString()
  @MinLength(11)
  document: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  address: string;
}
