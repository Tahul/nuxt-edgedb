CREATE MIGRATION m1x3k4pj7vpulmz2lt2xgos2rvqlpbo35iymu4prcgfsuvcixy6unq
    ONTO m1lmflqgxsmihc4iyaiz37ujsrhjqznhkbxbljgpfk32424z6o54oq
{
  ALTER TYPE default::BlogPost {
      ALTER LINK author {
          SET default := (GLOBAL default::current_user);
      };
  };
};
