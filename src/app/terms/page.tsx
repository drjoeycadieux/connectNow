
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { QrCode } from "@/components/connect-now/QrCode";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="sticky top-0 z-50 flex items-center justify-between h-20 px-4 md:px-8 bg-background/80 backdrop-blur-sm border-b">
        <h1 className="font-headline text-3xl font-bold text-primary">
          <Link href="/">Connect Now</Link>
        </h1>
        <Button variant="secondary" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </header>
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="font-headline text-4xl">Terms of Use</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none text-muted-foreground space-y-4">
              <p>
                Welcome to Connect Now. By accessing or using our service, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the service.
              </p>
              <h3 className="font-semibold text-foreground">1. Use of Service</h3>
              <p>
                You agree to use Connect Now only for lawful purposes. You are responsible for all your activities on the service, including your communications and the content you share. You may not use the service to engage in any activity that is illegal, harmful, or violates the rights of others.
              </p>
              <h3 className="font-semibold text-foreground">2. User Conduct</h3>
              <p>
                You agree not to misuse the service. This includes, but is not limited to: transmitting any material that is harassing, defamatory, or obscene; interfering with or disrupting the service or servers; or attempting to gain unauthorized access to any part of the service.
              </p>
              <h3 className="font-semibold text-foreground">3. Intellectual Property</h3>
              <p>
                All rights, title, and interest in and to the Connect Now service (excluding user content) are and will remain the exclusive property of Connect Now and its licensors.
              </p>
               <h3 className="font-semibold text-foreground">4. Termination</h3>
              <p>
                We may terminate or suspend your access to the service at any time, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms of Use.
              </p>
              <h3 className="font-semibold text-foreground">5. Changes to Terms</h3>
               <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
       <footer className="py-8 border-t bg-secondary/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex justify-center mb-4">
            <QrCode />
          </div>
          <div className="flex justify-center gap-4 mb-2">
            <Link href="/legal" className="text-sm hover:underline">Legal Information</Link>
            <Link href="/terms" className="text-sm hover:underline">Terms of Use</Link>
            <Link href="/contact" className="text-sm hover:underline">Contact Support</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Connect Now. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
