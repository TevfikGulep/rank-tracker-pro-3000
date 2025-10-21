
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

const addKeywordSchema = z.object({
  name: z.string().min(3, { message: "Anahtar kelime en az 3 karakter olmalıdır." }),
  country: z.string({ required_error: "Lütfen bir ülke seçin." }),
})

type AddKeywordFormValues = z.infer<typeof addKeywordSchema>

interface AddKeywordDialogProps {
  open: boolean
  onClose: () => void
  onAddKeyword: (newKeyword: Omit<Keyword, 'id' | 'history' | 'projectId'>) => void
}

export function AddKeywordDialog({
  open,
  onClose,
  onAddKeyword,
}: AddKeywordDialogProps) {
  const form = useForm<AddKeywordFormValues>({
    resolver: zodResolver(addKeywordSchema),
    defaultValues: {
      name: "",
      country: "Türkiye",
    },
  })

  const onSubmit = (data: AddKeywordFormValues) => {
    onAddKeyword(data)
    onClose()
  }

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Yeni Anahtar Kelime Ekle</DialogTitle>
              <DialogDescription>
                İzlemek için yeni bir anahtar kelime ve ülke ekleyin.
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <Button type="submit">Ekle</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
