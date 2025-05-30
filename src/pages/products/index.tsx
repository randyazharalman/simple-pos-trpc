import {
  DashboardDescription,
  DashboardHeader,
  DashboardLayout,
  DashboardTitle,
} from "@/components/layouts/DashboardLayout";
import type { NextPageWithLayout } from "../_app";
import { useState, type ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/data/mock";
import { ProductMenuCard } from "@/components/shared/product/ProductMenuCard";
import { ProductCatalogCard } from "@/components/shared/product/ProductCatalogCard";
import { api } from "@/utils/api";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ProductForm from "@/components/shared/product/ProductForm";
import {useForm } from "react-hook-form";
import { productFormSchema, type ProductFormSchema } from "@/forms/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";

const ProductsPage: NextPageWithLayout = () => {
  const apiUtils = api.useUtils();
  const [uploadedCreateProductImageUrl, setUploadedCreateProductImageUrl] = useState<string | null>(null)
  const [createProductDialogOpen, setCreateProductDialogOpen] = useState<boolean>(false);

  const {data: products} = api.product.getProducts.useQuery();

  const {mutate: createProduct} = api.product.createProduct.useMutation({
    onSuccess : async () => {
      await apiUtils.invalidate();
      alert("Create product successfully")
      createProductForm.reset()
      setCreateProductDialogOpen(false)
    }
  })

  const createProductForm = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema)
  })

  const handleSubmitCreateProduct = (values: ProductFormSchema) => {
    if(!uploadedCreateProductImageUrl) {
      alert("Please upload product image first")
      return
    }
    createProduct({
        ...values,
        imageUrl: uploadedCreateProductImageUrl
       });
  }
  return (
    <>
      <DashboardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <DashboardTitle>Product Management</DashboardTitle>
            <DashboardDescription>
              View, add, edit, and delete products in your inventory.
            </DashboardDescription>
          </div>
          <AlertDialog
            open={createProductDialogOpen}
            onOpenChange={(open) => {
              setCreateProductDialogOpen(open);
              if (!open) {
                createProductForm.reset(); 
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <Button>Add New Product</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Add New Product</AlertDialogTitle>
              </AlertDialogHeader>
              <Form {...createProductForm}>
                <ProductForm
                  onSubmit={handleSubmitCreateProduct}
                  onChangeImageUrl={(imageUrl) => setUploadedCreateProductImageUrl(imageUrl)}
                />
              </Form>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                type="submit" form="formProduct"
                  onClick={createProductForm.handleSubmit(
                    handleSubmitCreateProduct
                  )}
                >
                  Create Product
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
         {products?.map((product) => (
          <ProductCatalogCard
            key={product.id}
            name={product.productName}
            price={product.price}
            image={product.imageUrl ?? ""}
            category={product.category.name}
            onEdit={() => void 0}
            onDelete={() => void 0}
          />
        ))}
        {/* {PRODUCTS.map((product) => (
          <ProductCatalogCard
            key={product.id}
            name={product.name}
            price={product.price}
            image={product.image ?? ""}
            category={product.category}
            onEdit={() => void 0}
            onDelete={() => void 0}
          />
        ))} */}
      </div>
    </>
  );
};

ProductsPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ProductsPage;
