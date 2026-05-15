import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AnalysisLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-2/3 max-w-md" />
      <Skeleton className="mt-2 h-4 w-48" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <Card className="border-muted">
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Skeleton className="size-36 rounded-full" />
          </CardContent>
        </Card>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-muted">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
