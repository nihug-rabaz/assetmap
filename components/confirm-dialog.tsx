 "use client";
 
 import { Button } from "@/components/ui/button";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 
 interface ConfirmDialogProps {
   isOpen: boolean;
   title: string;
   description?: string;
   confirmText?: string;
   cancelText?: string;
   onConfirm: () => void;
   onCancel: () => void;
   confirmVariant?: "default" | "destructive";
 }
 
 export function ConfirmDialog({
   isOpen,
   title,
   description,
   confirmText = "אישור",
   cancelText = "ביטול",
   onConfirm,
   onCancel,
   confirmVariant = "destructive",
 }: ConfirmDialogProps) {
   return (
     <Dialog open={isOpen} onOpenChange={(open) => (!open ? onCancel() : undefined)}>
       <DialogContent showCloseButton>
         <DialogHeader>
           <DialogTitle>{title}</DialogTitle>
           {description && <DialogDescription>{description}</DialogDescription>}
         </DialogHeader>
         <DialogFooter>
           <Button variant="outline" onClick={onCancel}>
             {cancelText}
           </Button>
           <Button variant={confirmVariant} onClick={onConfirm}>
             {confirmText}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }
 
