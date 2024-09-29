/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import loadFfmpeg from "@/utils/loadFfmpeg";
import convertFile from "@/utils/convertFile";
import compressFileName from "@/utils/compressFileName";
import fileSize from "@/utils/fileSize";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState, useEffect } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { LuFileSymlink } from "react-icons/lu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "./ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { MdClose } from "react-icons/md";
import { ImSpinner3 } from "react-icons/im";
import { MdDone } from "react-icons/md";
import { HiOutlineDownload } from "react-icons/hi";
import { BiError } from "react-icons/bi";
import { BsFileEarmarkTextFill } from "react-icons/bs";
import Dropzone from "react-dropzone";
import { Action } from "@/types/Action";

export default function DropFile() {
  const accepted_Files = {
    "image/*": [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".webp",
      ".ico",
      ".tif",
      ".tiff",
      ".raw",
      ".tga",
    ],
  };

  const extensions = {
    image: [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "webp",
      "ico",
      "tif",
      "tiff",
      "svg",
      "raw",
      "tga",
    ],
  };

  const { toast } = useToast();

  const [actions, setActions] = useState<Action[]>([]);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [file, setFile] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isConverted, setIsConverted] = useState<boolean>(false);
  const [select, setSelect] = useState<string | null>(null);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const ffmpegRef = useRef<FFmpeg | null>(null);

  const reset = () => {
    setIsDone(false);
    setActions([]);
    setFile([]);
    setIsReady(false);
    setIsConverting(false);
  };

  const downloadAll = (): void => {
    for (const action of actions) {
      if (!action.is_error) {
        download(action);
      }
    }
  };

  const download = (action: Action) => {
    const a: HTMLAnchorElement = document.createElement("a");
    a.style.display = "none";
    a.href = action.url!;
    a.download = action.output!;

    document.body.appendChild(a);
    a.click();

    // Clean up after download
    URL.revokeObjectURL(action.url!);
    document.body.removeChild(a);
  };

  const convert = async (): Promise<void> => {
    let tmp_actions = actions.map((elt) => ({
      ...elt,
      is_converting: true,
    }));
    setActions(tmp_actions);
    setIsConverting(true);
    for (const action of tmp_actions) {
      try {
        const { url, output } = await convertFile(ffmpegRef.current!, action);
        tmp_actions = tmp_actions.map((elt) =>
          elt === action
            ? {
                ...elt,
                is_converted: true,
                is_converting: false,
                url,
                output,
              }
            : elt
        );
        setActions(tmp_actions);
      } catch (err) {
        tmp_actions = tmp_actions.map((elt) =>
          elt === action
            ? {
                ...elt,
                is_converted: false,
                is_converting: false,
                is_error: true,
              }
            : elt
        );
        setActions(tmp_actions);
      }
    }
    setIsDone(true);
    setIsConverting(false);
  };

  const updateAction = (file_name: string, to: string) => {
    setActions(
      actions.map((action): Action => {
        if (action.file_name === file_name) {
          console.log("FOUND");
          return {
            ...action,
            to,
          };
        }

        return action;
      })
    );
  };

  const handleUpload = (data: Array<File>): void => {
    handleExitHover();
    setFile(data);
    const tmp: Action[] = [];
    data.forEach((file: File) => {
      const formData = new FormData();
      tmp.push({
        file_name: file.name,
        file_size: file.size,
        from: file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2),
        to: null,
        file_type: file.type,
        file,
        is_converted: false,
        is_converting: false,
        is_error: false,
      });
    });
    setActions(tmp);
  };

  const deleteAction = (action: Action): void => {
    setActions(actions.filter((elt) => elt !== action));
    setFile(file.filter((elt) => elt.name !== action.file_name));
  };

  const checkIsReady = (): void => {
    let tmp_is_ready = true;
    actions.forEach((action: Action) => {
      if (!action.to) tmp_is_ready = false;
    });
    setIsReady(tmp_is_ready);
  };

  useEffect(() => {
    if (!actions.length) {
      setIsDone(false);
      setFile([]);
      setIsReady(false);
      setIsConverting(false);
    } else checkIsReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions]);
  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const ffmpeg_response: FFmpeg = await loadFfmpeg();
    ffmpegRef.current = ffmpeg_response;
    setIsLoaded(true);
  };

  const handleHover = (): void => setIsHovering(true);

  const handleExitHover = (): void => setIsHovering(false);

  if (actions.length) {
    return (
      <div className="space-y-6 overflow-y-hidden">
        {actions.map((action: Action, i) => (
          <div
            key={i}
            className="w-full py-4 space-y-2  relative cursor-pointer rounded-xl border h-fit px-4 lg:px-10 flex flex-wrap lg:flex-nowrap items-center justify-between"
          >
            {!isLoaded && (
              <Skeleton className="h-full w-full -ml-10 cursor-progress absolute rounded-xl" />
            )}
            <div className="flex gap-4 items-center">
              <span className="text-2xl text-rose-600">
                <BsFileEarmarkTextFill />
              </span>
              <div className="flex items-center gap-1 w-96">
                <span className="text-md font-medium overflow-x-hidden">
                  {compressFileName(action.file_name)}
                </span>
                <span className="text-muted-foreground text-sm">
                  ({fileSize(action.file_size)})
                </span>
              </div>
            </div>

            {action.is_error ? (
              <Badge variant="destructive" className="flex gap-2">
                <span>Error Converting File</span>
                <BiError />
              </Badge>
            ) : action.is_converting ? (
              <Badge variant="default" className="flex gap-2">
                <span>Converting</span>
                <span className="animate-spin">
                  <ImSpinner3 />
                </span>
              </Badge>
            ) : action.is_converted ? (
              <Badge variant="default" className="flex gap-2 bg-green-500">
                <span>Done</span>
                <MdDone />
              </Badge>
            ) : (
              <div className="text-muted-foreground text-md flex items-center gap-4">
                <span>Convert to</span>
                <Select
                  onValueChange={(value) => {
                    updateAction(action.file_name, value);
                  }}
                  value={action.to!}
                >
                  <SelectTrigger className="w-32 outline-none focus:outline-none focus:ring-0 text-center text-muted-foreground bg-background text-md font-medium">
                    <SelectValue placeholder="..." />
                  </SelectTrigger>
                  <SelectContent className="h-fit">
                    <div className="grid grid-cols-2 gap-2 w-fit">
                      {extensions.image.map((elt, i) => (
                        <div key={i} className="col-span-1 text-center">
                          <SelectItem value={elt} className="mx-auto">
                            {elt}
                          </SelectItem>
                        </div>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            )}
            {action.is_converted ? (
              <Button variant="outline" onClick={() => download(action)}>
                Download
              </Button>
            ) : (
              <span
                onClick={() => deleteAction(action)}
                className="cursor-pointer hover:bg-muted rounded-full h-10 w-10 flex items-center justify-center text-2xl text-foreground"
              >
                <MdClose />
              </span>
            )}
          </div>
        ))}
        <div className="flex w-full justify-end">
          {isDone ? (
            <div className="space-y-4 w-fit">
              <Button
                size="lg"
                className="rounded-xl font-semibold relative py-4 text-md flex gap-2 items-center w-full overflow-y-hidden"
                onClick={downloadAll}
              >
                {actions.length > 1 ? "Download All" : "Download"}
                <HiOutlineDownload />
              </Button>
              <Button
                size="lg"
                onClick={reset}
                variant="outline"
                className="rounded-xl"
              >
                Convert Other File(s)
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              disabled={!isReady || isConverting}
              className="rounded-xl font-semibold relative py-4 text-md flex items-center w-44 overflow-y-hidden"
              onClick={convert}
            >
              {isConverting ? (
                <span className="animate-spin text-lg ">
                  <ImSpinner3 />
                </span>
              ) : (
                <span>Convert Now</span>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Dropzone
        onDrop={handleUpload}
        onDragEnter={handleHover}
        onDragLeave={handleExitHover}
        accept={accepted_Files}
        onDropRejected={() => {
          handleExitHover();
          toast({
            variant: "destructive",
            title: "Error uploading your file(s)",
            description: "Allowed Files: Images.",
            duration: 5000,
          });
        }}
        onError={() => {
          handleExitHover();
          toast({
            variant: "destructive",
            title: "Error uploading your file(s)",
            description: "Allowed Files: Images.",
            duration: 5000,
          });
        }}
      >
        {({ getRootProps, getInputProps }) => (
          <div
            {...getRootProps()}
            className=" bg-background h-72 lg:h-80 xl:h-96 rounded-3xl shadow-sm border-secondary border-2 border-dashed border-black cursor-pointer flex items-center justify-center"
          >
            <input {...getInputProps()} />
            <div className="space-y-4 text-foreground">
              {isHovering ? (
                <>
                  <div className="justify-center flex text-6xl">
                    <LuFileSymlink />
                  </div>
                  <h3 className="text-center font-medium text-2xl">
                    Yes, right there
                  </h3>
                </>
              ) : (
                <>
                  <div className="justify-center flex text-6xl text-rose-300">
                    <FiUploadCloud />
                  </div>
                  <h3 className="text-center font-medium text-2xl text-rose-300">
                    Click, or drop your files here
                  </h3>
                </>
              )}
            </div>
          </div>
        )}
      </Dropzone>
    </div>
  );
}
