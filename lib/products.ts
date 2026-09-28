import { z } from "zod";

export const ProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number(),
  stock: z.number(),
  images: z.array(z.string().url()).optional(),
});

export const ProductDraftSchema = ProductSchema.extend({ id: z.number() });

export type ProductDraft = z.infer<typeof ProductDraftSchema>;

// รายชื่อหมวดหมู่ คัดลอกจาก
// https://dummyjson.com/products/category-list
export const CATEGORIES = [
  "beauty", "fragrances", "furniture", "groceries",
  "home-decoration", "kitchen-accessories", "laptops",
  "mens-shirts", "mens-shoes", "mens-watches",
  "mobile-accessories", "motorcycle", "skin-care",
  "smartphones", "sports-accessories", "sunglasses",
  "tablets", "tops", "vehicle", "womens-bags",
  "womens-dresses", "womens-jewellery", "womens-shoes", "womens-watches",
] as const;

export const SORT_FIELDS = ["title", "price", "stock"] as const;

// ลบ type SearchQuery ที่ประกาศไว้ในหัวข้อ 1.4 ออก แล้วใช้สองบล็อกนี้แทน
export const SearchQuerySchema = z.object({
  q: z.string().trim(),
  limit: z
    .number({ error: "กรุณากรอกจำนวนรายการ" })
    .int("จำนวนรายการต้องเป็นจำนวนเต็ม")
    .min(1, "อย่างน้อย 1 รายการ")
    .max(30, "ไม่เกิน 30 รายการ"),
  sortBy: z.enum(SORT_FIELDS),
  images: z.array(z.string().url()).optional(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const ProductListSchema = z.object({
  products: z.array(ProductSchema),
  total: z.number(),
  skip: z.number(),
  limit: z.number(),
});

// เติม: ตัวช่วยของ Zod ที่อ่าน Type ออกมาจาก Schema
export type Product = z.infer<typeof ProductSchema>;
export type ProductList = z.infer<typeof ProductListSchema>;

const API_BASE = "https://dummyjson.com";

export const defaultQuery: SearchQuery = {
  q: "",
  limit: 10,
  sortBy: "title",
};

export function buildProductUrl(query: SearchQuery): string {
  const params = new URLSearchParams();
  params.set("q", query.q);
  // เติม: เมธอดที่กำหนดค่าให้พารามิเตอร์หนึ่งตัว
  params.set("limit", String(query.limit));
  params.set("sortBy", query.sortBy);
  params.set("order", "asc");
  // เปลี่ยนจาก "title,price,stock,category"
  params.set("select", "title,price,stock,category,images");


  return `${API_BASE}/products/search?${params.toString()}`;
}


export async function fetchProducts(
  query: SearchQuery
): Promise<ProductList> {
  const response = await fetch(buildProductUrl(query));
  console.log("สถานะการตอบกลับ:", response);
  // เติม: ค่าที่บอกว่าสถานะการตอบกลับอยู่ในช่วง 200 ถึง 299 หรือไม่
  if (!response.ok) {
    throw new Error(`เรียกข้อมูลไม่สำเร็จ สถานะ ${response.status}`);
  }

  // เติม: เมธอดที่อ่านเนื้อหาการตอบกลับเป็น JSON
  const data = await response.json();
  console.log("ข้อมูลที่ได้รับจาก API:", data);

  // เติม: เมธอดที่ตรวจข้อมูลแล้วคืนผลลัพธ์แทนการโยน Error
  const result = ProductListSchema.safeParse(data);

  if (!result.success) {
    throw new Error("รูปแบบข้อมูลที่ได้รับไม่ตรงกับที่กำหนดไว้");
  }

  return result.data;
}