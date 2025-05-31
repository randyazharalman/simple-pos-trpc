import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductFormSchema } from "@/forms/product";
import { uploadFileToSignedUrl } from "@/lib/supabase";
import { Bucket } from "@/server/bucket";
import { api } from "@/utils/api";
import { type ChangeEvent } from "react";
import { useFormContext } from "react-hook-form";

type ProductFormProps = {
  onSubmit: (values: ProductFormSchema) => void;
  onChangeImageUrl: (imageUrl: string) => void;
};
const ProductForm = ({ onSubmit, onChangeImageUrl }: ProductFormProps) => {
  const form = useFormContext<ProductFormSchema>();
  const { data: categories } = api.category.getCategories.useQuery();

  const {mutateAsync: createImageSignedUrl} = api.product.crateProductImageUploadSignedUrl.useMutation()

  const imageChangeHandler = async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;

      if(files && files?.length > 0) {
        const file = files[0];

        if(!file) return;
        const {path, token} = await createImageSignedUrl()

        const imageUrl = await uploadFileToSignedUrl({
          bucket: Bucket.ProductImages,
          path,
          file,
          token
        })
        onChangeImageUrl(imageUrl)
        alert("Uploaded image")
      }
  }
  
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-2"
      id="formProduct"
    >
      <FormField
        control={form.control}
        name="productName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product Name</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Price</FormLabel>
            <FormControl>
              <Input type="number" {...field} 
              // onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="categoryId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((item, index) => (
                    <SelectItem key={index} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="">
        <label>Product Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={imageChangeHandler}
        />
      </div>
    </form>
  );
};

export default ProductForm;
