//const axios = require('axios').default;

export class FileHelper {
  public static async loadFileData<T>(filename: string): Promise<T> {
    //const data:T = await axios.get(`../data/${filename}`);
    const data:T = await import(`../../../data/${filename}`);
    return data;
  }

  public static async loadFileDataAsAny(filename: string): Promise<any> {
    const data = await import(`../../../data/${filename}`);
    return data;
  }
}