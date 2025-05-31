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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ProductForm from "@/components/shared/product/ProductForm";
import { useForm } from "react-hook-form";
import { productFormSchema, updateProductFormSchema, type ProductFormSchema, type UpdateProductFormSchema, } from "@/forms/product";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";

const ProductsPage: NextPageWithLayout = () => {
  const apiUtils = api.useUtils();
    const [editProductDialogOpen, setEditProductDialogOpen] = useState<boolean>(false);
  const [uploadedCreateProductImageUrl, setUploadedCreateProductImageUrl] =
    useState<string | null>(null);
  const [createProductDialogOpen, setCreateProductDialogOpen] =
    useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productToEdit, setProductToEdit] = useState<string | null>(null);
  const { data: products } = api.product.getProducts.useQuery();

  const { mutate: createProduct } = api.product.createProduct.useMutation({
    onSuccess: async () => {
      await apiUtils.invalidate();
      alert("Create product successfully");
      createProductForm.reset();
      setCreateProductDialogOpen(false);
    },
  });

  const {mutate: updateProduct, isPending: isUpdating} = api.product.updateProduct.useMutation({
      onSuccess: async () => {
        await apiUtils.product.getProducts.invalidate();
        alert("Update Product successfully");
        setEditProductDialogOpen(false);
        editProductForm.reset();
      },
    })

  const { mutate: deleteProductById } =
    api.product.deleteProductById.useMutation();

  const createProductForm = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
  });
  const editProductForm = useForm<UpdateProductFormSchema>({
      resolver: zodResolver(updateProductFormSchema),
  });

  const handleSubmitCreateProduct = (values: ProductFormSchema) => {
    if (!uploadedCreateProductImageUrl) {
      alert("Please upload product image first");
      return;
    }
    createProduct({
      ...values,
      imageUrl: uploadedCreateProductImageUrl,
    });
  };

    const handleSubmitEditProduct = (data: ProductFormSchema) => {
      console.log(data);
      if (!productToEdit) return alert("No product selected");
      updateProduct({
        ...data,
        productId: productToEdit,
      });
    };
  
  const handleClickEditProduct = (product: {
  productName: string;
  id: string;
  price: number;
  categoryId: string;
  imageUrl: string | null;
}) => {
  setEditProductDialogOpen(true);
  setProductToEdit(product.id);

  editProductForm.reset({
    productName: product.productName,
    price: product.price,
    imageUrl: product.imageUrl ?? "", // fallback string kosong
    categoryId: product.categoryId,
  });
};

  const handleClickDeleteProduct = (productId: string) => {
    setProductToDelete(productId);
  };

  const handleConfirmDeleteProduct = () => {
    if (!productToDelete) return;
    deleteProductById({
      productId: productToDelete,
    });
  };
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
                  onChangeImageUrl={(imageUrl) =>
                    setUploadedCreateProductImageUrl(imageUrl)
                  }
                />
              </Form>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  type="submit"
                  form="formProduct"
                  onClick={createProductForm.handleSubmit(
                    handleSubmitCreateProduct,
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
            onEdit={() => handleClickEditProduct({...product, categoryId: product.category.id})}
            onDelete={() => handleClickDeleteProduct(product.id)}
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
        
        {/* UPDATE PRODUCT DIALOG  */}

         <AlertDialog
                open={editProductDialogOpen}
                onOpenChange={setEditProductDialogOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Edit Category</AlertDialogTitle>
                  </AlertDialogHeader>
                  <Form {...editProductForm}>
                    <ProductForm
                      onSubmit={handleSubmitEditProduct}
                      onChangeImageUrl={() => void 0}
                      // submitText="Edit Product"
                    />
                  </Form>
        
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                      onClick={editProductForm.handleSubmit(handleSubmitEditProduct)}
                      disabled={isUpdating}
                    >
                      Edit Category
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

        {/* DELETE PRODUCT DIALOG  */}
        <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setProductToDelete(null);
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot
              be undone.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleConfirmDeleteProduct}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

ProductsPage.getLayout = (page: ReactElement) => {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ProductsPage;
