import Link from 'next/link'
import ArrowThin from '../icons/arrow-thin'

type props = {
  collection: Collection
}

export default function CategoryCard({ collection }: props) {
  return (
    <Link
      key={collection.handle}
      href={`/category/${collection.handle}`}
      className="group relative min-w-[226px] min-h-[255px] md:min-w-[467px] md:min-h-[563px] flex flex-col gap-2 mx-1 lg:mx-2.5 aspect-[4/5]"
    >
      <ArrowThin className="size-6 -rotate-45 text-white absolute top-2.5 right-2.5 lg:top-5 lg:right-5 z-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
      <div className="relative h-full w-full overflow-hidden rounded-xl lg:rounded-3xl before:blurred-edges [--blur:20px]">
        <img
          src={collection.image.url}
          alt={collection.image.altText || `${collection.title} category image`}
          sizes="(max-width: 768px) 100vw, 467px"
          className="h-full w-full object-cover select-none absolute inset-0"
        />
      </div>
      <h3 className="text-xl font-normal lg:text-white lg:absolute lg:bottom-4 lg:left-5">
        {collection.title}
      </h3>
    </Link>
  )
}