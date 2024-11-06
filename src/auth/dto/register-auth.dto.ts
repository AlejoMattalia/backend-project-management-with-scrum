import { IsEmail, IsString, MaxLength, MinLength, IsUrl } from "class-validator";

export class RegisterDto {
    @IsString({ message: 'El nombre debe ser una cadena de texto.' })
    @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
    @MaxLength(30, { message: 'El nombre no puede tener más de 30 caracteres.' })
    name: string;

    @IsEmail({}, { message: 'El correo electrónico no es válido.' })
    email: string;

    @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
    @MaxLength(20, { message: 'La contraseña no puede tener más de 20 caracteres.' })
    password: string;

    @IsUrl({}, { message: 'La imagen debe ser una URL válida.' })
    image_url: string;
}
