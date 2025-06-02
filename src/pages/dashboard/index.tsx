import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import { CategoryFilterCard } from "@/components/shared/category/CategoryFilterCard";
import { CreateOrderSheet } from "@/components/shared/CreateOrderSheet";
import { ProductMenuCard } from "@/components/shared/product/ProductMenuCard";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart } from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";
import type { NextPageWithLayout } from "../_app";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";

const DashboardPage: NextPageWithLayout = () => {
  const cartStore = useCartStore()
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orderSheetOpen, setOrderSheetOpen] = useState(false);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const {data: products} = api.product.getProducts.useQuery(
    {
      categoryId: selectedCategory,
      productQuery: searchQuery
    }
  );

  const { data: categories } = api.category.getCategories.useQuery();

  const totalProducts = categories?.reduce((a, b ) => {
    return a + b._count.product
  },0)

  const handleAddToCart = (productId: string) => {
    const productToAdd = products?.find(product => product.id === productId)
    
    if(!productToAdd) {
      toast("Product not found")
      return
    }
    cartStore.addToCart({
      productId: productId,
      productName: productToAdd.productName,
      price: productToAdd.price,
      imageUrl: productToAdd.imageUrl ?? ""
    })
  };


  return (
    <>
      <DashboardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <DashboardTitle>Dashboard {cartStore.items.length}</DashboardTitle>
            <DashboardDescription>
              Welcome to your Simple POS system dashboard.
            </DashboardDescription>
          </div>

          {
            !!cartStore.items.length && (
          <Button
            className="animate-in slide-in-from-right"
            onClick={() => setOrderSheetOpen(true)}
          >
            <ShoppingCart /> Cart
          </Button>
            )
          }

        </div>
      </DashboardHeader>

      <div className="space-y-6">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-2">
          <CategoryFilterCard
              key={"all"}
              name={"All"}
              productCount={totalProducts ?? 0}
              isSelected={selectedCategory === "all"}
              onClick={() => handleCategoryClick("all")}
            />
          {categories?.map((category) => (
            <CategoryFilterCard
              key={category.id}
              name={category.name}
              productCount={category._count.product}
              isSelected={selectedCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </div>

        <div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products?.map((product) => (
                <ProductMenuCard
                  key={product.id}
                  productId={product.id}
                  productName={product.productName}
                  price={product.price}
                  imageUrl={product.imageUrl ?? "https://placehold.co/600x400"}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
        </div>
      </div>

      <CreateOrderSheet
        open={orderSheetOpen}
        onOpenChange={setOrderSheetOpen}
      />
    </>
  );
};

DashboardPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default DashboardPage;
