import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { cartApi, type Cart } from "../api/cart";
import { useAuth } from "./AuthContext";

interface CartContextType {
  cart: Cart | null;
  cartCount: number;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity: number) => Promise<void>;
  updateItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setIsLoading(true);
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch cart whenever auth state changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(
    async (productId: number, quantity: number) => {
      await cartApi.addItem({ productId, quantity });
      await fetchCart();
    },
    [fetchCart]
  );

  const updateItem = useCallback(
    async (productId: number, quantity: number) => {
      await cartApi.updateItem(productId, { productId, quantity });
      await fetchCart();
    },
    [fetchCart]
  );

  const removeItem = useCallback(
    async (productId: number) => {
      await cartApi.removeItem(productId);
      await fetchCart();
    },
    [fetchCart]
  );

  const clearCart = useCallback(async () => {
    await cartApi.clearCart();
    setCart(null);
  }, []);

  const cartCount =
    cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        isLoading,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
