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
  decrementCartItem: (productId: string) => void;
  clearCart: () => void;
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
  decrementCartItem: (productId) => {
  set((state) => {
    const existingItemIndex = state.items.findIndex(
      (item) => item.productId === productId
    );

    // Jika tidak ditemukan, return state tanpa perubahan
    if (existingItemIndex === -1) return state;

    const items = [...state.items];
    const item = items[existingItemIndex]!;
    

    // Jika quantity <= 1 atau 0 => hapus item dari cart 
    if (item.quantity <= 1) {
      items.splice(existingItemIndex, 1); // hapus item
    } else {
      items[existingItemIndex] = {
        ...item,
        quantity: item.quantity - 1,
      };
    }

    return {
      ...state,
      items,
    };
  });
},

  clearCart: () => {
    set((state)=> {
      return {
        ...state,
        items: []
      }
    })
  }
}));
