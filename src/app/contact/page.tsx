import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";
import Link from "next/link";
import { QrCode } from "@/components/connect-now/QrCode";

export default function ContactPage() {
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
              <CardTitle className="font-headline text-4xl">Contact Support</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none text-muted-foreground space-y-6">
              <p>
                If you need help, have a question, or want to report an issue, please don't hesitate to reach out to our support team. We are available to assist you with any technical difficulties or inquiries you may have.
              </p>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Support
                </h3>
                <p>
                  For the fastest response, please email us at:
                  <a href="mailto:support@connectnow.example.com" className="text-primary hover:underline ml-2">
                    support@connectnow.example.com
                  </a>
                </p>
                <p>
                  Our support team is available 24/7 and typically responds within a few hours.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="py-8 border-t bg-secondary/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex justify-center mb-4">
            <QrCode />
          </div>
          <p>&copy; {new Date().getFullYear()} Connect Now. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
