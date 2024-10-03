import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto, CreateSubcategoryDto, UpdateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(createCategoryDto: CreateCategoryDto) {
    const { name, parentId, subcategoryId } = createCategoryDto;
    return this.prisma.category.create({
      data: {
        name,
        parentId: parentId ? Number(parentId) : null,
        subcategoryId: subcategoryId ? Number(subcategoryId) : null, // Handle nested subcategories
      },
    });
  }

  async createSubcategory(createSubcategoryDto: CreateSubcategoryDto) {
    const { name, parentCategoryName } = createSubcategoryDto;
    const parentCategory = await this.prisma.category.findFirst({
      where: { name: parentCategoryName },
    });

    if (!parentCategory) {
      throw new NotFoundException('Parent category not found');
    }

    return this.prisma.category.create({
      data: {
        name,
        parentId: parentCategory.id,
      },
    });
  }

  // Create a nested subcategory
  async createNestedSubcategory(createCategoryDto: CreateCategoryDto) {
    const { name, subcategoryId } = createCategoryDto;

    const subcategory = await this.prisma.category.findUnique({
      where: { id: subcategoryId },
    });

    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }

    return this.prisma.category.create({
      data: {
        name,
        subcategoryId: subcategory.id,
      },
    });
  }

  async getCategories() {
    return this.prisma.category.findMany({
      include: {
        subcategories: true,
      },
    });
  }

  async getCategoryById(id: number) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: true,
      },
    });
  }

  async getCategoryByName(name: string) {
    return this.prisma.category.findFirst({
      where: { name },
      include: {
        subcategories: true,
      },
    });
  }

  async getSubcategoriesByCategoryId(categoryId: number) {
    return this.prisma.category.findMany({
      where: {
        parentId: categoryId,
      },
    });
  }

  async getSubcategoryByName(name: string) {
    return this.prisma.category.findFirst({
      where: { name, NOT: { parentId: null } }, // Ensure it's a subcategory
    });
  }

  async getNestedSubcategoriesBySubcategoryId(subcategoryId: number) {
    return this.prisma.category.findMany({
      where: { subcategoryId },
    });
  }

  async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto) {
    const { name, parentId, subcategoryId } = updateCategoryDto;
    return this.prisma.category.update({
      where: { id },
      data: {
        name,
        parentId: parentId ? Number(parentId) : null,
        subcategoryId: subcategoryId ? Number(subcategoryId) : null,
      },
    });
  }

  async updateSubcategory(subcategoryName: string, updateCategoryDto: UpdateCategoryDto) {
    const { name, parentId } = updateCategoryDto;
    const subcategory = await this.prisma.category.findFirst({
      where: { name: subcategoryName, NOT: { parentId: null } }, // Ensure it's a subcategory
    });

    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }

    return this.prisma.category.update({
      where: { id: subcategory.id },
      data: {
        name,
        parentId: parentId ? Number(parentId) : null,
      },
    });
  }

  async updateNestedSubcategory(id: number, updateCategoryDto: UpdateCategoryDto) {
    const { name, parentId, subcategoryId } = updateCategoryDto;

    return this.prisma.category.update({
      where: { id },
      data: {
        name,
        parentId: parentId ? Number(parentId) : null,
        subcategoryId: subcategoryId ? Number(subcategoryId) : null,
      },
    });
  }

  async deleteCategory(id: number) {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async deleteSubcategory(subcategoryName: string) {
    const subcategory = await this.prisma.category.findFirst({
      where: { name: subcategoryName, NOT: { parentId: null } }, // Ensure it's a subcategory
    });

    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }

    return this.prisma.category.delete({
      where: { id: subcategory.id },
    });
  }

  async deleteNestedSubcategory(id: number) {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  // Methods to get categories without subcategories
  async getCategoriesWithoutSubcategories() {
    return this.prisma.category.findMany({
      where: { parentId: null }, // Fetch only root categories without subcategories
    });
  }

  async getCategoryByIdWithoutSubcategories(id: number) {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }

  async getCategoryByNameWithoutSubcategories(name: string) {
    return this.prisma.category.findFirst({
      where: { name },
    });
  }
}
