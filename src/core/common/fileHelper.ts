declare const require: {
  context(
    directory: string,
    useSubdirectories?: boolean,
    regExp?: RegExp,
  ): {
    <T>(id: string): T;
  };
};

type JsonModule<T> = { default: T };

const dataFiles = require.context('../../../data', true, /\.json$/);

export class FileHelper {
  public static async loadFileData<T>(filename: string): Promise<T> {
    const data = dataFiles<T | JsonModule<T>>(this.normalizePath(filename));
    return this.getModuleValue(data);
  }

  private static normalizePath(filename: string): string {
    return `./${filename.replace(/^\.?\//, '')}`;
  }

  private static getModuleValue<T>(moduleValue: T | JsonModule<T>): T {
    if (
      moduleValue
      && typeof moduleValue === 'object'
      && 'default' in moduleValue
    ) {
      return moduleValue.default;
    }

    return moduleValue as T;
  }
}