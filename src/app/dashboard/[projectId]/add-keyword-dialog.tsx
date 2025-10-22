
"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { countries } from "@/lib/data"
import type { Keyword } from "@/lib/types"

const keywordSchema = z.object({
  name: z.string().min(3, { message: "Anahtar kelime en az 3 karakter olmalıdır." }),
  country: z.string({ required_error: "Lütfen bir ülke seçin." }),
})

type KeywordFormValues = z.infer<typeof keywordSchema>

interface KeywordDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: KeywordFormValues) => void
  keywordToEdit?: Keyword | null
}

export function KeywordDialog({
  open,
  onClose,
  onSubmit,
  keywordToEdit,
}: KeywordDialogProps) {
  const isEditMode = !!keywordToEdit;

  const form = useForm<KeywordFormValues>({
    resolver: zodResolver(keywordSchema),
  })

  useEffect(() => {
    if (open) {
      if (isEditMode) {
        form.reset({
          name: keywordToEdit.name,
          country: keywordToEdit.country,
        });
      } else {
        form.reset({
          name: "",
          country: "Türkiye",
        });
      }
    }
  }, [open, isEditMode, keywordToEdit, form]);


  const handleFormSubmit = (data: KeywordFormValues) => {
    onSubmit(data)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Anahtar Kelimeyi Düzenle" : "Yeni Anahtar Kelime Ekle"}</DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "Anahtar kelime adını veya ülkesini güncelleyin."
                  : "İzlemek için yeni bir anahtar kelime ve ülke ekleyin."
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anahtar Kelime</FormLabel>
                    <FormControl>
                      <Input placeholder="ör: 'en iyi kahve makinesi'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ülke</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Bir ülke seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                İptal
              </Button>
              <Button type="submit">{isEditMode ? "Güncelle" : "Ekle"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
