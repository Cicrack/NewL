import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X, Plus, Image, Tag, DollarSign } from "lucide-react";

const productFormSchema = z.object({
  title: z.string().min(1, "Product title is required").max(255, "Title is too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().min(1, "Price is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  category: z.string().optional(),
  stock: z.string().optional().transform((val) => val ? parseInt(val) : 1),
});

export default function ProductForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      imageUrl: "",
      category: "",
      stock: "1",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product posted successfully",
      });
      form.reset();
      setHashtags([]);
      setImageUrls([]);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof productFormSchema>) => {
    const productData = {
      ...values,
      price: parseFloat(values.price),
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };
    
    createProductMutation.mutate(productData);
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace('#', '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (url && !imageUrls.includes(url)) {
      try {
        new URL(url); // Validate URL
        setImageUrls([...imageUrls, url]);
        setImageUrlInput("");
      } catch {
        toast({
          title: "Error",
          description: "Please enter a valid URL",
          variant: "destructive",
        });
      }
    }
  };

  const removeImageUrl = (urlToRemove: string) => {
    setImageUrls(imageUrls.filter(url => url !== urlToRemove));
  };

  const handleHashtagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addHashtag();
    }
  };

  const handleImageUrlKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addImageUrl();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Product Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-charcoal font-semibold">Product Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="What are you selling?"
                  className="border-cream focus:border-terracotta"
                  {...field}
                  data-testid="input-product-title"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-charcoal font-semibold">Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your product in detail..."
                  className="border-cream focus:border-terracotta resize-none"
                  rows={4}
                  {...field}
                  data-testid="textarea-product-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Price and Stock */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-charcoal font-semibold flex items-center">
                  <DollarSign size={16} className="mr-1" />
                  Price
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="0.00"
                    type="text"
                    className="border-cream focus:border-terracotta"
                    {...field}
                    data-testid="input-product-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-charcoal font-semibold">Stock Quantity</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="1"
                    type="number"
                    min="0"
                    className="border-cream focus:border-terracotta"
                    {...field}
                    data-testid="input-product-stock"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-charcoal font-semibold">Category (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Electronics, Fashion, Home & Garden"
                  className="border-cream focus:border-terracotta"
                  {...field}
                  data-testid="input-product-category"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Main Image URL */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-charcoal font-semibold flex items-center">
                <Image size={16} className="mr-1" />
                Main Image URL (Optional)
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/image.jpg"
                  type="url"
                  className="border-cream focus:border-terracotta"
                  {...field}
                  data-testid="input-main-image-url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Additional Images */}
        <div>
          <Label className="text-charcoal font-semibold flex items-center mb-3">
            <Image size={16} className="mr-1" />
            Additional Images
          </Label>
          
          <div className="flex space-x-2 mb-3">
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              onKeyPress={handleImageUrlKeyPress}
              className="flex-1 border-cream focus:border-terracotta"
              data-testid="input-additional-image-url"
            />
            <Button
              type="button"
              onClick={addImageUrl}
              variant="outline"
              className="border-cream hover:bg-cream"
              data-testid="button-add-image"
            >
              <Plus size={16} />
            </Button>
          </div>

          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={url} 
                    alt={`Additional ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-cream"
                    data-testid={`img-preview-${index}`}
                  />
                  <Button
                    type="button"
                    onClick={() => removeImageUrl(url)}
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                    data-testid={`button-remove-image-${index}`}
                  >
                    <X size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hashtags */}
        <div>
          <Label className="text-charcoal font-semibold flex items-center mb-3">
            <Tag size={16} className="mr-1" />
            Hashtags
          </Label>
          
          <div className="flex space-x-2 mb-3">
            <Input
              placeholder="handmade, vintage, organic"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyPress={handleHashtagKeyPress}
              className="flex-1 border-cream focus:border-terracotta"
              data-testid="input-hashtag"
            />
            <Button
              type="button"
              onClick={addHashtag}
              variant="outline"
              className="border-cream hover:bg-cream"
              data-testid="button-add-hashtag"
            >
              <Plus size={16} />
            </Button>
          </div>

          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, index) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="bg-cream text-charcoal hover:bg-medium-gray hover:text-white cursor-pointer"
                  onClick={() => removeHashtag(tag)}
                  data-testid={`hashtag-badge-${index}`}
                >
                  #{tag}
                  <X size={12} className="ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full gradient-bg text-white py-3 rounded-xl font-semibold hover:opacity-90"
          disabled={createProductMutation.isPending}
          data-testid="button-submit-product"
        >
          {createProductMutation.isPending ? "Posting..." : "Post Product"}
        </Button>
      </form>
    </Form>
  );
}
