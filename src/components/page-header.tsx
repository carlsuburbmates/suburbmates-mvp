import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
};

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <section
      className={cn(
        "container mx-auto px-4 py-8 md:py-12",
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="text-lg text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
