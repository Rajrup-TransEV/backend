import { Module } from '@nestjs/common';
import { RoleModule } from './modules/role/role.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email/email.service';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { CategoriesModule } from './modules/category/category.module';
import { NotificationModule } from './modules/notification/notification.module';
import { StoreModule } from './modules/store/store.module';
import { AdminSettingsModule } from './modules/admin-settings/admin-settings.module'; // New module for admin settings

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Configures the configuration globally
    }),
    PrismaModule,
    RoleModule,
    AdminModule,
    AuthModule,
    ProductsModule,
    CartModule,
    CategoriesModule,
    NotificationModule,
    StoreModule,
    AdminSettingsModule, // Added AdminSettingsModule
  ],
  controllers: [AppController],
  providers: [AppService, EmailService],
})
export class AppModule {}
