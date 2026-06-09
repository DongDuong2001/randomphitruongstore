import { PrismaClient, ProductCategory } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    nameVi: "Sukajan Hạc Sóng",
    nameEn: "Crane Embroidery Sukajan",
    slug: "sukajan-hac-song",
    descriptionVi:
      "Áo Sukajan hai mặt với họa tiết hạc thêu nổi, form relaxed và bo viền tương phản. Phù hợp làm điểm nhấn cho outfit đơn sắc.",
    descriptionEn:
      "A reversible Sukajan with raised crane embroidery, relaxed proportions and contrast ribbing. Built as the focal point of a minimal outfit.",
    category: ProductCategory.SUKAJAN,
    price: 2490000,
    sizes: ["M", "L", "XL"],
    colors: ["Black", "Navy"],
    materialVi: "Satin cao cấp, lót poly",
    materialEn: "Premium satin, polyester lining",
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    nameVi: "Sukajan Hổ Midnight",
    nameEn: "Midnight Tiger Sukajan",
    slug: "midnight-tiger-sukajan",
    descriptionVi:
      "Sukajan đen với chủ đề hổ thêu sau lưng, vải bóng vừa phải và tay raglan để phối cùng quần rộng.",
    descriptionEn:
      "Black Sukajan with a back tiger motif, restrained sheen and raglan sleeves made to pair with wide trousers.",
    category: ProductCategory.SUKAJAN,
    price: 2690000,
    sizes: ["M", "L", "XL", "XXL"],
    colors: ["Black", "Burgundy"],
    materialVi: "Satin dày, bo dệt",
    materialEn: "Heavy satin, knitted ribbing",
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    nameVi: "Bomber Utility 01",
    nameEn: "Utility Bomber 01",
    slug: "utility-bomber-01",
    descriptionVi:
      "Bomber form boxy, túi nắp lớn và chi tiết kim loại tối giản. Lớp lót nhẹ phù hợp thời tiết giao mùa.",
    descriptionEn:
      "A boxy bomber with oversized flap pockets and minimal metal hardware. Lightly lined for transitional weather.",
    category: ProductCategory.BOMBER,
    price: 2190000,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Olive"],
    materialVi: "Nylon chống gió, lót lưới",
    materialEn: "Wind-resistant nylon, mesh lining",
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    nameVi: "Bomber Washed Graphite",
    nameEn: "Washed Graphite Bomber",
    slug: "washed-graphite-bomber",
    descriptionVi:
      "Bomber xử lý washed màu graphite, vải có độ đứng và phom vai rộng. Mỗi sản phẩm có sắc độ washed nhẹ khác nhau.",
    descriptionEn:
      "A graphite washed bomber with structured fabric and broad shoulders. Each garment has slight tonal variation.",
    category: ProductCategory.BOMBER,
    price: 2390000,
    sizes: ["M", "L", "XL"],
    colors: ["Graphite"],
    materialVi: "Cotton canvas xử lý washed",
    materialEn: "Washed cotton canvas",
    isFeatured: false,
    images: [
      "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    nameVi: "Hoodie Heavyweight Logo",
    nameEn: "Heavyweight Logo Hoodie",
    slug: "heavyweight-logo-hoodie",
    descriptionVi:
      "Hoodie nỉ dày với form oversize có kiểm soát, mũ hai lớp và logo thêu nhỏ trước ngực.",
    descriptionEn:
      "A heavyweight hoodie with a controlled oversized fit, double-layer hood and restrained chest embroidery.",
    category: ProductCategory.HOODIE,
    price: 1490000,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Ash Gray", "Cream"],
    materialVi: "Cotton nỉ 420gsm",
    materialEn: "420gsm cotton fleece",
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    nameVi: "Áo khoác Technical Shell",
    nameEn: "Technical Shell Jacket",
    slug: "technical-shell-jacket",
    descriptionVi:
      "Áo khoác shell nhẹ với dây rút điều chỉnh, túi ẩn và bề mặt cản nước. Thiết kế sạch để mặc hằng ngày.",
    descriptionEn:
      "A lightweight shell with adjustable cords, concealed pockets and a water-resistant face. Clean enough for daily wear.",
    category: ProductCategory.JACKET,
    price: 2890000,
    sizes: ["M", "L", "XL"],
    colors: ["Black", "Stone"],
    materialVi: "Nylon cản nước 3 lớp",
    materialEn: "Three-layer water-resistant nylon",
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    nameVi: "Áo khoác Denim Raw Cut",
    nameEn: "Raw Cut Denim Jacket",
    slug: "raw-cut-denim-jacket",
    descriptionVi:
      "Jacket denim đen với đường cắt thô có chủ đích, form crop và chi tiết wash nhẹ ở các điểm ma sát.",
    descriptionEn:
      "A black denim jacket with intentional raw edges, cropped proportions and subtle wear at friction points.",
    category: ProductCategory.JACKET,
    price: 1990000,
    sizes: ["S", "M", "L"],
    colors: ["Washed Black"],
    materialVi: "Denim cotton 13oz",
    materialEn: "13oz cotton denim",
    isFeatured: false,
    images: [
      "https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?auto=format&fit=crop&w=1200&q=85"
    ]
  },
  {
    nameVi: "Áo Aviator Lông Seasonal",
    nameEn: "Seasonal Faux Fur Aviator",
    slug: "seasonal-faux-fur-aviator",
    descriptionVi:
      "Mẫu aviator order theo mùa với cổ lông bản lớn và khóa kim loại. Shop sẽ xác nhận lịch sản xuất trước khi nhận cọc.",
    descriptionEn:
      "A seasonal aviator with an oversized faux-fur collar and metal zip. Production timing is confirmed before deposit.",
    category: ProductCategory.SEASONAL,
    price: 3290000,
    sizes: ["M", "L", "XL"],
    colors: ["Black", "Brown"],
    materialVi: "Da PU cao cấp, lông nhân tạo",
    materialEn: "Premium PU leather, faux fur",
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1548126032-079a0fb0099d?auto=format&fit=crop&w=1200&q=85"
    ]
  }
];

async function main() {
  for (const product of products) {
    const { images, ...data } = product;
    await prisma.product.upsert({
      where: { slug: data.slug },
      update: {
        ...data,
        images: {
          deleteMany: {},
          create: images.map((url, index) => ({
            url,
            altVi: data.nameVi,
            altEn: data.nameEn,
            sortOrder: index
          }))
        }
      },
      create: {
        ...data,
        images: {
          create: images.map((url, index) => ({
            url,
            altVi: data.nameVi,
            altEn: data.nameEn,
            sortOrder: index
          }))
        }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
