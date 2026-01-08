// apps/api/force-ab.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AB_URL = "https://www.ab.gr/api/v1/?operationName=GetCategoryProductSearch&variables=%7B%22lang%22%3A%22gr%22%2C%22searchQuery%22%3A%22%22%2C%22category%22%3A%22010002007%22%2C%22pageNumber%22%3A0%2C%22pageSize%22%3A100%2C%22filterFlag%22%3Atrue%2C%22fields%22%3A%22PRODUCT_TILE%22%2C%22plainChildCategories%22%3Atrue%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22afce78bc1a2f0fe85f8592403dd44fae5dd8dce455b6eeeb1fd6857cc61b00a2%22%7D%7D";

const HEADERS = {
  "accept": "*/*",
  "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,pt;q=0.7",
  "apollographql-client-name": "gr-ab-web-stores",
  "apollographql-client-version": "963cf53bdf82d4ea97406e2c4bd4e7843383f4e5",
  "content-type": "application/json",
  "cookie": "rxVisitor=17678697544109P2FPKF6G2U8U8AU2MJDVISRAHAK632M; _abck=4235A572101A1D4C6AD000D542AF4235~-1~YAAQIzMTAuzguJqbAQAAWrU/nQ9bUJwVIIDEO/GeeUcvvKkiWqQcFX941Sg2pLJzP2bAJzuhpm3+RHz9ZLpqV0NQNNSkFoVBpfB+t9b31Yak7K7inoYWHyTv+O/KwAwp4znLbZFOMIONAWEhfJwIMcsZmWVjsjv1SEmkSLuaVkll/iYCqmMsXQmqQfFJjlh/ZaBq/zbkNxTP2x+LbzSqcTYsPLdyDK9wzQJr+hFOUTRiyoIV0tpbP+FuSujhMdGmTQjRiQ36GwSKbSTzVoMLaSYtqqeoxrNgl5VHr5DWEtGpFKgzf+03vMxrDvWyBVv5q7eE7Hb72QmFyhKPSrGobHvpi14uGjdOw1MdrWe/dKqVWGL73VQjDI8Vnkg6Gg4mdj3QjKY35pWjxguCgOMAuIDTwABJs/W1fPctUxyfHTHASj61KHxseGnHTk2JfF9Nnu/7NKSk9ZDozDc3OCT6JlslMp7M5hydQpgVpVsimHM=~-1~-1~-1~-1~-1; groceryCookieLang=gr; liquidFeeThreshold=0; deviceSessionId=01aeb4af-e1f4-4090-be27-e0c991c3c685; rxvt=1767871558053|1767869754414; dtPC=-27717$269754407_812h-vVSNUVRLKWEHDCIWUIGHBWDMULCFNJGEF-0e0; VersionedCookieConsent=v%3A2%2Cessential%3A1%2Canalytics%3A1%2Csocial%3A1%2Cperso_cont%3A1%2Cperso_ads%3A1%2Cads_external%3A1; at_check=true; s_pls=not%20logged; s_fid=0BA9769836F0638E-033C0FA9215DB930; s_cc=true; dtCookie=v_4_srv_9_sn_ND2HD1BLFDGIQLNVO3BGO4LLUTLC699E_perc_100000_ol_0_mul_1_app-3A440a591b5a5302d3_0; _fbp=fb.1.1767869760663.15952813198652901; _gcl_au=1.1.2040690038.1767869761; dtSa=true%7CC%7C-1%7C%CE%98%CE%AD%CE%BB%CF%89%20%CE%B5%CF%80%CE%B9%CF%83%CF%84%CF%81%CE%BF%CF%86%CE%AE%20%CF%87%CF%81%CE%B7%CE%BC%CE%AC%CF%84%CF%89%CE%BD%7C-%7C1767869761161%7C269754407_812%7Chttps%3A%2F%2Fwww.ab.gr%2F%7C%7C%7C%7C; AMCV_2A6E210654E74B040A4C98A7%40AdobeOrg=-1124106680%7CMCMID%7C90695809771182129466080934501909755183%7CMCAID%7CNONE%7CvVersion%7C5.2.0%7CMCIDTS%7C20462; kndctr_2A6E210654E74B040A4C98A7_AdobeOrg_identity=CiY5MDY5NTgwOTc3MTE4MjEyOTQ2NjA4MDkzNDUwMTkwOTc1NTE4M1IRCLHA_-m5MxgBKgRJUkwxMAPwAbHA_-m5Mw==; lkws_12158=684d7ac6-5e22-3e08-f4a4-da0f2e15ded8; gpv_loginStatus=not%20logged; kndctr_2A6E210654E74B040A4C98A7_AdobeOrg_cluster=irl1; bm_mi=57E1F7CBD84ADE23C392BB5F7CACA88E~YAAQITMTArMBgoabAQAA2KnxnR7RbMismKUrjZXyRe39fQI03L0jka5/sgvg8b4h0Jd21IGi5ywzzYYTp1RH3zE8ThvIZ97MAyE83HxoI3fwHU23qk6q60hiXGWH2eOLm2S/RGoLwLFJq5ghUY4F1We4SQGAp6CyoApVH3xIYAoyQaAFjpBWCebDbeeZvyh2Z/lHpyrRRpIfVz7zIZQOKh+XI3RM1BCZkjYIoS/bJHbwm4QXKT3yuaDGh6hXdX84BYs3GPEWwdZR2T8g84gtXQ2XkurGBS/pZE9OWX6yDfyzOR0EAf4MyzgqzII=~1; bm_sv=F722F4FE70210073D8C97B8F3C1AA911~YAAQITMTAjADgoabAQAAp7jxnR6Hlx927eZ2LKvulXk/zQC2RDIOeNQPClNFCFhi0VPl4KnQJzNLugv9eGTpun206811ZH4RzcE5JOd4wy1vnnJPdEpNEqoNBIxx7Hd5BT/z5LNmPiHFAsp+HlsaF9qwczLPRzhjiDOEgvDJtiX1niauxHuW2OmzEjPs0S7417Knn4pJqi8iQrhc4+zaNoYJgmmN0sxx9iFEPCJEFRQN6pvb9xVv+ZR4kw2hgUCD~1; ak_bmsc=D2DCC3E8339012FA72BC0D96F353C419~000000000000000000000000000000~YAAQIzMTAp04xZqbAQAA5Sr9nR7k1JLL+Ci619ONBF/pLR2fK5DQoAV8ZZ98BUMO7TAf++n12ARaIqbXWo9vn98kcvVq+YzJ6PcH0/ai2h8eE8vW2jl1LjUW2RUp/hBkT6+tjKevu4Z1JoG+VxdJcghnKspBNnRtC+EEqmC5ThDzCNS8ceItil9NlqiOYPk9xMm2pxCG+Mnd1ppbXauePmRSY31MhU4HCJ8uPChasl6t11FyaEgTkIma9oDeUZmIm4CSKwqy+c7vRLgOwuLSCrIPIxzHAPDjTz4GubcMPYozucpwybdLaIbGQp4nJaV/xzYbEfQA99NbO11nqhL7XR9TvTwHeBIegAhh67Prue9TzIAjmdeChwccNhvaHy923WqiFRlfetPQ7O1tGz3QbLOhYbjSWQ8RVqgPtYe9KLetRIV17CQvMwjgTlxLC21LJecMi5QOMs9G5GoLZo02jzaYO93qnA==; bm_sz=542D464232F447B4654F4E4379AC24B3~YAAQIzMTAp44xZqbAQAA5Sr9nR6UKXfgHZzDBpj5aM5r+FdAoCbm5ferdhELpg28/CK4/4vGU7A2+nB+FX7FHsR/GGc/xEnd8HfU7IrO753XszMn5sodr54BLtiA7fniTgjf2+7dNxkKD4acSaXsHwik0CPyCTcvr0weaPnSa1oShwnSJMJfm3ybZUBAJgBVG7vs8+rW++WM+TjyDS1zv1J+Gmti+z/R0b3AgDxqfu1bPFZkrDd1KU1bMNTo4+wo0F63fCRlkiEoQxBFJRRlpIoTA9+wM5Lp9f5/4GaDE+o+01pB3yKLxK1s9KXrtDGNr31xOZJXAtY/0/l6pbbQH5ex3zwR/DGlt7gG94ogwpvfxuKN3HY5pYuiyuLRJ8WK6DlhSY+hIVxCK/XiV1v5zDgaFQ7kOcFjlSHj2a7K2aR5jinjfq6/LNX4U9+Y5lN5pPUuVN1V2QI6AfUz2oRGI+wLfiSJEXRtbhy9WA==~4536120~3750201; s_ppn=market%3Acategory%3A%CF%81%CF%8D%CE%B6%CE%B9%20-%20%CF%8C%CF%83%CF%80%CF%81%CE%B9%CE%B1%3A%CF%81%CF%8D%CE%B6%CE%B9%20%CE%B1%CF%81%CF%89%CE%BC%CE%B1%CF%84%CE%B9%CE%BA%CF%8C%3Acategory-listing; mbox=PC#4b5c82f11c8c4369a9e16bdce90f02c2.37_0#1831126973|session#9622d3038be5402bb5b48cfac725b579#1767884490; AWSALB=Ke3uSJ4+c0XghPLJLAa1yv9bWBwmwGsnurcUaT9/zkXDTVGAhDlVtD+ghVEX6o0cSPdAG4A6SXXu9la8q7ySumwSfYqV12+/PyHKQxFqNSvYxWIlcE0YiAaAV2TH; AWSALBCORS=Ke3uSJ4+c0XghPLJLAa1yv9bWBwmwGsnurcUaT9/zkXDTVGAhDlVtD+ghVEX6o0cSPdAG4A6SXXu9la8q7ySumwSfYqV12+/PyHKQxFqNSvYxWIlcE0YiAaAV2TH; Referer: https://www.ab.gr/el/eshop/Vasika-typopoiimena-trofima/Ryzi-Ospria/Ryzi-aromatiko/c/010002007"
};

async function forceIngest() {
  console.log("🚀 Starting Force Ingestion for AB...");
  
  const res = await fetch(AB_URL, { headers: HEADERS });
  const json = await res.json() as any;
  const products = json.data?.categoryProductSearch?.products || [];

  console.log(`📦 Found ${products.length} products. Syncing to DB...`);

  // Βρίσκουμε το storeId του ΑΒ
  const store = await prisma.store.findFirst({ where: { name: { contains: "ab" } } });
  if (!store) return console.error("AB Store not found in DB");

  for (const item of products) {
    const price = item.price?.current?.value || item.price?.unitPrice || 0;
    
    // Upsert Product
    const dbProduct = await prisma.product.upsert({
      where: { storeId_externalId: { storeId: store.id, externalId: item.code } },
      update: { name: item.name, imageUrl: item.images?.[0]?.url || item.image },
      create: {
        storeId: store.id,
        externalId: item.code,
        name: item.name,
        imageUrl: item.images?.[0]?.url || item.image,
      }
    });

    // Create Price Snapshot
    await prisma.priceSnapshot.create({
      data: {
        productId: dbProduct.id,
        price: price.toString(),
        collectedAt: new Date()
      }
    });
  }

  console.log("✅ Sync Complete!");
}

forceIngest();