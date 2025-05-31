import { create } from "zustand";

type CartItem = {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

type AddToCartItem = Omit<CartItem, "quantity">;

interface CartState {
  items: CartItem[];
  addToCart: (newItem: AddToCartItem) => void;
}

export const useCartStore = create<CartState>()((set) => ({
  items: [],
  addToCart: (newItem) => {
    set((state) => {
      /// state = immutable -> tidak boleh diubah secara langsung
      const duplicateItems = [...state.items];

      const existingItemIndex = duplicateItems.findIndex(
        (item) => item.productId === newItem.productId,
      );

      if (existingItemIndex === -1) {
        duplicateItems.push({
          productId: newItem.productId,
          productName: newItem.productName,
          price: newItem.price,
          imageUrl: newItem.imageUrl,
          quantity: 1,
        });
      } else {
        const itemToUpdate = duplicateItems[existingItemIndex];

        if (!itemToUpdate) return {...state};

        itemToUpdate.quantity += 1;
      }

      return {
        ...state,
        items: duplicateItems,
      };
    });
    // alert(newItem.productName)
  },
}));
