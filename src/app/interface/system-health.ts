export interface SystemHealth {
    status: string;
    components: {
      diskSpace: {
        status: string,
        details: {
          total: number,
          free: number | string,
          threshold: number
        }
      },
      mongo: {
        status: string,
        details: {
          version: string
        }
      }
    };

}
