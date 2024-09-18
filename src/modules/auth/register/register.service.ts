import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateSellerDto } from './dto/update-seller.dto'; // Import the new DTO
import { EmailService } from 'src/email/email.service';

@Injectable()
export class RegisterService {
    constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService) { }

    // Register a new user
    async register(createUserDto: CreateUserDto) {
        const { name, username, password, email, phoneNumber } = createUserDto;

        // Check if the user already exists
        const existingUser = await this.prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const user = await this.prisma.user.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
                phoneNumber,
            },
        });

        // Send welcome email
        await this.emailService.sendMail(user.email, 'Welcome to Our Service', 'Thank you for registering!');

        return user;
    }

    async findOne(id: number) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    // Fetch all users
    async getAllUsers() {
        return this.prisma.user.findMany({ include: { role: true } });
    }

    // Fetch all sellers
    async getAllSellers() {
        return this.prisma.user.findMany({
            where: { isSeller: true },
            include: { role: true },
        });
    }

    // Get a seller by ID
    async getSellerById(id: number) {
        const seller = await this.prisma.user.findUnique({
            where: { id },
            include: { role: true },
        });

        if (!seller || !seller.isSeller) {
            throw new NotFoundException('Seller not found');
        }

        return seller;
    }

    // Update user details
    async updateUser(updateUserDto: UpdateUserDto) {
        const { id, username, roleId, companyName, description, contactPerson, address, phoneNumber } = updateUserDto;

        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const dataToUpdate: any = {
            username: username ?? undefined,
            roleId: roleId ?? undefined,
            isSeller: roleId === 3 ? true : undefined,
            companyName: companyName ?? undefined,
            description: description ?? undefined,
            contactPerson: contactPerson ?? undefined,
            address: address ?? undefined,
            phoneNumber: phoneNumber ?? undefined,
        };

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });

        return updatedUser;
    }

    // Update seller details
    async updateSeller(updateSellerDto: UpdateSellerDto) {
        const { id, storeName, storeAddress, storeEmail, storePhoneNumber, aboutUs, logo } = updateSellerDto;

        const seller = await this.prisma.user.findUnique({ where: { id } });
        if (!seller || !seller.isSeller) {
            throw new NotFoundException('Seller not found');
        }

        const dataToUpdate: any = {
            storeName: storeName ?? undefined,
            storeAddress: storeAddress ?? undefined,
            storeEmail: storeEmail ?? undefined,
            storePhoneNumber: storePhoneNumber ?? undefined,
            aboutUs: aboutUs ?? undefined,
            logo: logo ?? undefined,
        };

        const updatedSeller = await this.prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });

        return updatedSeller;
    }

    // Delete a user by ID
    async deleteUser(userId: number) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.prisma.user.delete({ where: { id: userId } });
        return { message: 'User deleted successfully' };
    }

    // Delete a seller by ID
    async deleteSeller(sellerId: number) {
        const seller = await this.prisma.user.findUnique({ where: { id: sellerId } });
        if (!seller || !seller.isSeller) {
            throw new NotFoundException('Seller not found');
        }

        await this.prisma.user.delete({ where: { id: sellerId } });
        return { message: 'Seller deleted successfully' };
    }
}
