"use client";

import { defaultQuery, fetchProducts } from "@/lib/products";
import type {
    Product, ProductDraft, ProductList, SearchQuery,
} from "@/lib/products";
import ProductSearchForm from "./ProductSearchForm";
import ProductForm from "./ProductForm";
import { useEffect, useState } from "react";

type LoadState = "loading" | "error" | "ready";

export default function ProductExplorer() {
    const [products, setProducts] = useState<Product[]>([]);
    const [status, setStatus] = useState<LoadState>("loading");
    const [errorMessage, setErrorMessage] = useState("");
    
    // 1. ประกาศ State editing ไว้ด้านบนสุดพร้อมกับ State อื่น ๆ
    const [editing, setEditing] = useState<Product | null>(null);

    // 2. โหลดข้อมูลเริ่มต้นตอนเปิดหน้าเว็บครั้งแรก
    useEffect(() => {
        fetchProducts(defaultQuery).then(showResult).catch(showError);
    }, []);

    function showResult(list: ProductList) {
        setProducts(list.products);
        setStatus("ready");
        console.log(`โหลดข้อมูลสำเร็จ จำนวน ${list.total} รายการ`, list.products);
    }

    function showError(error: unknown) {
        setErrorMessage(
            error instanceof Error ? error.message : "เรียกข้อมูลไม่สำเร็จ"
        );
        setStatus("error");
    }

    async function loadProducts(query: SearchQuery) {
        setStatus("loading");
        setErrorMessage("");

        try {
            showResult(await fetchProducts(query));
        } catch (error) {
            showError(error);
        }
    }

    function saveProduct(draft: ProductDraft) {
        if (editing) {
            // กรณีแก้ไข: อัปเดตข้อมูลตัวเดิมโดยใช้ map สร้าง Array ใหม่
            setProducts(products.map(p => p.id === editing.id ? { ...draft, id: editing.id } : p));
            setEditing(null); // เคลียร์สถานะกลับสู่โหมดเพิ่ม
        } else {
            // กรณีเพิ่มใหม่: ต่อท้าย Array เดิม
            setProducts([...products, { ...draft, id: Date.now() }]);
        }
    }

    function removeProduct(id: number) {
        setProducts(products.filter(p => p.id !== id));
        if (editing?.id === id) {
            setEditing(null);
        }
    }

    return (
        <main>
            <h1>รายการสินค้า</h1>

            <button
                type="button"
                onClick={() => loadProducts(defaultQuery)}
                disabled={status === "loading"}
            >
                {status === "loading" ? "กำลังโหลด" : "โหลดข้อมูล"}
            </button>

            {/* ฟอร์มค้นหา */}
            <ProductSearchForm onSearch={loadProducts} />

            <section style={{ margin: "20px 0" }}>
                <h2>{editing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2>
                {/* 3. ส่งค่า editing ตัวจริงเข้าไป (ไม่ใช่ null) */}
                <ProductForm
                    editing={editing}
                    onSave={saveProduct}
                    onCancel={() => setEditing(null)}
                />
            </section>

            <section aria-live="polite">
                {status === "loading" && <p>กำลังโหลดข้อมูล</p>}

                {status === "error" && <p role="alert">{errorMessage}</p>}

                {status === "ready" && products.length === 0 && (
                    <p>ไม่พบสินค้าที่ตรงกับเงื่อนไข</p>
                )}

                {status === "ready" && products.length > 0 && (
                    <table>
                        <thead>
                            <tr>
                                <th>รูปภาพ</th>
                                <th>ชื่อสินค้า</th>
                                <th>ราคา</th>
                                <th>คงเหลือ</th>
                                <th>หมวดหมู่</th>
                                <th>จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {item.images?.map((imgUrl: string, index: number) => (
                                                <img
                                                    key={index}
                                                    src={imgUrl}
                                                    alt={`${item.title} - ${index + 1}`}
                                                    width={40}
                                                    height={40}
                                                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td>{item.title}</td>
                                    <td>{item.price}</td>
                                    <td>{item.stock}</td>
                                    <td>{item.category}</td>
                                    <td>
                                        <button type="button" onClick={() => setEditing(item)}>แก้ไข</button>
                                        <button type="button" onClick={() => removeProduct(item.id)} style={{ marginLeft: '8px' }}>ลบ</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </main>
    );
}