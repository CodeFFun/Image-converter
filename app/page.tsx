import DropFile from "@/components/DropFile";

export default function Home() {
  return (
    <>
    <div className="flex flex-col items-center justify-center" >
      <h1 className="text-4xl font-bold p-5 text-rose-400">
        Convert Image to your required format
      </h1>
      <p className="text-2xl text-slate-500">
        Upload single or multiple images and convert them to your required format
      </p>
    </div>
    <div className="p-10 text-slate-500">
      <DropFile />
    </div>
    </>
  );
}
