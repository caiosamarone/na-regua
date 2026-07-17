declare module "cloudinary" {
  export namespace v2 {
    function config(options: {
      cloud_name?: string;
      api_key?: string;
      api_secret?: string;
      url?: string;
    }): void;

    namespace uploader {
      function upload(
        file: string | Buffer,
        options?: Partial<{
          folder: string;
          public_id: string;
          resource_type: string;
          overwrite: boolean;
        }>,
      ): Promise<{
        public_id: string;
        secure_url: string;
        url: string;
        format: string;
        bytes: number;
      }>;
    }
  }
}
