import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LegalPage() {
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
              <CardTitle className="font-headline text-4xl">Legal Information</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none text-muted-foreground space-y-4">
              <p>
                This page is intended to provide legal information regarding the use of the Connect Now service. The information provided herein is for general informational purposes only and is not legal advice.
              </p>
              <h3 className="font-semibold text-foreground">1. Data Privacy</h3>
              <p>
                Connect Now is committed to protecting your privacy. Our service is designed with end-to-end encryption, meaning that we cannot access the content of your communications. We collect minimal data necessary for the operation of the service, such as connection metadata. For more details, please refer to our full Privacy Policy.
              </p>
              <h3 className="font-semibold text-foreground">2. Compliance</h3>
              <p>
                Our services are designed to comply with major data protection regulations. However, it is the user's responsibility to ensure that their use of Connect Now complies with all applicable local, state, national, and international laws and regulations.
              </p>
              <h3 className="font-semibold text-foreground">3. Disclaimers</h3>
              <p>
                The service is provided "as is" and "as available" without any warranties of any kind, either express or implied, including, but not limited to, the implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the service will be uninterrupted, secure, or error-free.
              </p>
               <h3 className="font-semibold text-foreground">4. Contact Information</h3>
              <p>
                If you have any questions about this legal information, please contact us at legal@connectnow.example.com.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="py-8 border-t bg-secondary/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Connect Now. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
