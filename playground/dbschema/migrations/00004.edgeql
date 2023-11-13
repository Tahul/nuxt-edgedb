CREATE MIGRATION m1o7wch7mvqsqf6du5jqax4udzgnda6w5qdftr527ev27whifzlzoa
    ONTO m1x3k4pj7vpulmz2lt2xgos2rvqlpbo35iymu4prcgfsuvcixy6unq
{
  ALTER TYPE default::User {
      CREATE MULTI LINK posts: default::BlogPost {
          ON SOURCE DELETE DELETE TARGET;
      };
  };
};
