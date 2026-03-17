import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Order, Product } from "../backend.d";
import { type OrderStatus, ProductCategory } from "../backend.d";
import { useActor } from "../hooks/useActor";
import {
  CATEGORY_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  formatINR,
} from "../lib/bakery-utils";

const EMPTY_PRODUCT: Omit<Product, "id"> = {
  name: "",
  description: "",
  pricePaise: BigInt(0),
  category: ProductCategory.floursGrains,
  stockQuantity: BigInt(0),
};

export default function AdminPage() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: () => actor!.getProducts(),
    enabled: !!actor && !isFetching,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["allOrders"],
    queryFn: () => actor!.getAllOrders(),
    enabled: !!actor && !isFetching,
  });

  const [productForm, setProductForm] = useState<
    Omit<Product, "id"> & { id?: string }
  >(EMPTY_PRODUCT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});

  const addMutation = useMutation({
    mutationFn: (p: Product) => actor!.addProduct(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product added");
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to add product"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, p }: { id: string; p: Product }) =>
      actor!.updateProduct(id, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated");
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to update"),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, p }: { id: string; p: Product }) =>
      actor!.updateProduct(id, p),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock updated");
      setStockEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    onError: () => toast.error("Failed to update stock"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => actor!.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      actor!.updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allOrders"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  if (isFetching) {
    return (
      <div
        className="container mx-auto px-4 py-20 text-center"
        data-ocid="admin.loading_state"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  const openAdd = () => {
    setEditingId(null);
    setProductForm(EMPTY_PRODUCT);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setProductForm(p);
    setDialogOpen(true);
  };

  const handleSave = () => {
    const id = editingId || crypto.randomUUID();
    const product: Product = { ...productForm, id };
    if (editingId) {
      updateMutation.mutate({ id: editingId, p: product });
    } else {
      addMutation.mutate(product);
    }
  };

  const handleStockSave = (product: Product) => {
    const rawValue = stockEdits[product.id];
    const newQty = BigInt(rawValue ?? Number(product.stockQuantity));
    stockMutation.mutate({
      id: product.id,
      p: { ...product, stockQuantity: newQty },
    });
  };

  const lowStockCount = products.filter(
    (p) => Number(p.stockQuantity) <= 5,
  ).length;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl font-bold">Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="mb-6">
          <TabsTrigger value="products" data-ocid="admin.products.tab">
            Products ({products.length})
          </TabsTrigger>
          <TabsTrigger value="stock" data-ocid="admin.stock.tab">
            Stock Management
            {lowStockCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {lowStockCount} low
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" data-ocid="admin.orders.tab">
            Orders ({orders.length})
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">All Products</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={openAdd}
                  data-ocid="admin.product.open_modal_button"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent data-ocid="admin.product.dialog">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Product" : "Add Product"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm((f) => ({ ...f, name: e.target.value }))
                      }
                      data-ocid="admin.product.name.input"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      data-ocid="admin.product.description.textarea"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Price (in paise, 100 = &#x20B9;1)</Label>
                      <Input
                        type="number"
                        value={Number(productForm.pricePaise)}
                        onChange={(e) =>
                          setProductForm((f) => ({
                            ...f,
                            pricePaise: BigInt(e.target.value || 0),
                          }))
                        }
                        data-ocid="admin.product.price.input"
                      />
                    </div>
                    <div>
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={Number(productForm.stockQuantity)}
                        onChange={(e) =>
                          setProductForm((f) => ({
                            ...f,
                            stockQuantity: BigInt(e.target.value || 0),
                          }))
                        }
                        data-ocid="admin.product.stock.input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={productForm.category}
                      onValueChange={(v) =>
                        setProductForm((f) => ({
                          ...f,
                          category: v as ProductCategory,
                        }))
                      }
                    >
                      <SelectTrigger data-ocid="admin.product.category.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-ocid="admin.product.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={addMutation.isPending || updateMutation.isPending}
                    data-ocid="admin.product.save_button"
                  >
                    {(addMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto">
            <Table data-ocid="admin.products.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p, idx) => (
                  <TableRow
                    key={p.id}
                    data-ocid={`admin.products.row.${idx + 1}`}
                  >
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{CATEGORY_LABELS[p.category]}</TableCell>
                    <TableCell>{formatINR(p.pricePaise)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          Number(p.stockQuantity) <= 5
                            ? "text-destructive font-semibold"
                            : ""
                        }
                      >
                        {p.stockQuantity.toString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(p)}
                          data-ocid={`admin.products.row.${idx + 1}.edit_button`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(p.id)}
                          data-ocid={`admin.products.row.${idx + 1}.delete_button`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Stock Management Tab */}
        <TabsContent value="stock">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Stock Management</h2>
            {lowStockCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {lowStockCount} product{lowStockCount > 1 ? "s" : ""} low on
                stock (≤5 units)
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground">
                Update stock quantities inline. Items with ≤5 units are
                highlighted.
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table data-ocid="admin.stock.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="w-40">Current Stock</TableHead>
                      <TableHead className="w-32">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p, idx) => {
                      const isLow = Number(p.stockQuantity) <= 5;
                      const editedValue = stockEdits[p.id];
                      const displayValue =
                        editedValue !== undefined
                          ? editedValue
                          : p.stockQuantity.toString();
                      const isDirty = editedValue !== undefined;

                      return (
                        <TableRow
                          key={p.id}
                          className={isLow ? "bg-destructive/5" : ""}
                          data-ocid={`admin.stock.row.${idx + 1}`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isLow && (
                                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                              )}
                              <span
                                className={
                                  isLow
                                    ? "text-destructive font-medium"
                                    : "font-medium"
                                }
                              >
                                {p.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {CATEGORY_LABELS[p.category]}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={displayValue}
                              onChange={(e) =>
                                setStockEdits((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              className={`w-28 ${
                                isLow
                                  ? "border-destructive focus-visible:ring-destructive/30"
                                  : ""
                              }`}
                              data-ocid={`admin.stock.row.${idx + 1}.input`}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={isDirty ? "default" : "outline"}
                              disabled={!isDirty || stockMutation.isPending}
                              onClick={() => handleStockSave(p)}
                              data-ocid={`admin.stock.row.${idx + 1}.save_button`}
                            >
                              {stockMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3 mr-1" />
                              )}
                              Save
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {products.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-10 text-muted-foreground"
                          data-ocid="admin.stock.empty_state"
                        >
                          No products found. Add products first.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <h2 className="font-semibold text-lg mb-4">All Orders</h2>
          <div className="overflow-x-auto">
            <Table data-ocid="admin.orders.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Update Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, idx) => (
                  <TableRow
                    key={order.id}
                    data-ocid={`admin.orders.row.${idx + 1}`}
                  >
                    <TableCell className="font-mono text-xs">
                      {order.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-xs">
                      {order.deliveryAddress.name}
                      <br />
                      {order.deliveryAddress.phone}
                    </TableCell>
                    <TableCell>{formatINR(order.totalAmountPaise)}</TableCell>
                    <TableCell>
                      {order.deliveryOption === "express"
                        ? "Express"
                        : "Standard"}
                    </TableCell>
                    <TableCell>
                      <Badge className={ORDER_STATUS_COLORS[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(v) =>
                          statusMutation.mutate({
                            id: order.id,
                            status: v as OrderStatus,
                          })
                        }
                      >
                        <SelectTrigger
                          className="w-40"
                          data-ocid={`admin.orders.row.${idx + 1}.select`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
