import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

function App() {
  return (
    <main className="min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border border-sky-500/30 bg-sky-500/10 text-sky-200">
              UI foundation
            </Badge>
            <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              Dark Go-style
            </Badge>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-normal text-slate-100 sm:text-5xl">
              Базова UI-конфігурація готова
            </h1>
            <p className="text-base leading-7 text-slate-300 sm:text-lg">
              Це smoke-test екран для перевірки Tailwind v4, shadcn/ui,
              темної палітри та базових інтерактивних станів. Backend API тут
              не підключається.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-800 bg-slate-900/90 shadow-2xl shadow-slate-950/20">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100">
                shadcn/ui компоненти
              </CardTitle>
              <CardDescription className="text-slate-400">
                Кнопки, картки, бейджі, прогрес і скелетони працюють у темній
                темі.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button>Основна дія</Button>
                <Button variant="secondary">Другорядна</Button>
                <Button variant="outline">Контур</Button>
              </div>

              <Separator className="bg-slate-800" />

              <Progress value={64} className="gap-2">
                <ProgressLabel className="text-slate-200">
                  Перевірка foundation
                </ProgressLabel>
                <ProgressValue className="text-cyan-300">
                  {(formattedValue) => formattedValue ?? '64%'}
                </ProgressValue>
              </Progress>
            </CardContent>
            <CardFooter className="border-slate-800 bg-slate-950/40 text-slate-400">
              Smoke-test не є MVP-сторінкою.
            </CardFooter>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-xl text-slate-100">
                Стани форми
              </CardTitle>
              <CardDescription className="text-slate-400">
                Поля вводу й loading placeholders без API-запитів.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="foundation-email" className="text-slate-200">
                  Тестове поле
                </Label>
                <Input
                  id="foundation-email"
                  placeholder="name@example.com"
                  className="border-slate-800 bg-slate-950/70 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4 bg-slate-800" />
                <Skeleton className="h-4 w-1/2 bg-slate-800" />
                <Skeleton className="h-9 w-full bg-slate-800" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

export default App
