import thichPng from '@/assets/reactions/ptiters/thich.png';
import hahaPng from '@/assets/reactions/ptiters/haha.png';
import wowPng from '@/assets/reactions/ptiters/wow.png';
import camOnPng from '@/assets/reactions/ptiters/cam-on.png';
import chotDealPng from '@/assets/reactions/ptiters/chot-deal.png';
import uyTinPng from '@/assets/reactions/ptiters/uy-tin.png';
import dangToiPng from '@/assets/reactions/ptiters/dang-toi.png';
import doiChutPng from '@/assets/reactions/ptiters/doi-chut.png';
import quanTamPng from '@/assets/reactions/ptiters/quan-tam.png';
import hetTienPng from '@/assets/reactions/ptiters/het-tien.png';
import hocBaiPng from '@/assets/reactions/ptiters/hoc-bai.png';
import khaNghiPng from '@/assets/reactions/ptiters/kha-nghi.png';
import { ReactionKey } from '../../types';

export interface ReactionDefinition {
  key: ReactionKey;
  label: string;
  src: string;
  description: string;
}

export const SIGNATURE_REACTIONS: ReactionDefinition[] = [
  { key: 'THICH', label: 'Thích', src: thichPng, description: 'Rất thích / Đồng ý' },
  { key: 'HAHA', label: 'Haha', src: hahaPng, description: 'Buồn cười / Vui vẻ' },
  { key: 'WOW', label: 'Wow', src: wowPng, description: 'Bất ngờ / Tuyệt vời' },
  { key: 'CAM_ON', label: 'Cảm ơn', src: camOnPng, description: 'Biết ơn / Cảm kích' },
  { key: 'CHOT_DEAL', label: 'Chốt deal', src: chotDealPng, description: 'Đồng ý giao dịch' },
  { key: 'UY_TIN', label: 'Uy tín', src: uyTinPng, description: 'Rất uy tín / Đáng tin' },
  { key: 'DANG_TOI', label: 'Đang tới', src: dangToiPng, description: 'Đang đi / Sắp đến nơi' },
  { key: 'DOI_CHUT', label: 'Đợi chút', src: doiChutPng, description: 'Chờ tí nhé' },
  { key: 'QUAN_TAM', label: 'Quan tâm', src: quanTamPng, description: 'Hóng tin / Để ý' },
  { key: 'HET_TIEN', label: 'Hết tiền', src: hetTienPng, description: 'Cháy túi / Không đủ tiền' },
  { key: 'HOC_BAI', label: 'Học bài', src: hocBaiPng, description: 'Bận ôn thi / Học tập' },
  { key: 'KHA_NGHI', label: 'Khả nghi', src: khaNghiPng, description: 'Nghi ngờ / Có gì đó sai sai' },
];

export const REACTION_MAP = new Map<ReactionKey, ReactionDefinition>(
  SIGNATURE_REACTIONS.map((r) => [r.key, r])
);
