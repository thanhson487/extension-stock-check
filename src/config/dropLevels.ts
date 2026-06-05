export const DROP_LEVELS: Record<string, number[]> = {
  // Nông nghiệp – thực phẩm (chu kỳ)
  DBC: [-25, -40, -55, -65],

  // Logistics – vận tải (chu kỳ mạnh)
  HAH: [-25, -40, -55, -65],

  // Bất động sản
  // HDG: BĐS + điện (trung gian)
  HDG: [-30, -45, -55, -65],

  // IDC: KCN (thường không cần tới -70)
  IDC: [-25, -40, -55, -65],

  // KDH: BĐS chất lượng hơn (bớt sâu để dễ kích hoạt)
  KDH: [-25, -40, -50, -60],

  // Công nghiệp – vật liệu (chu kỳ)
  HPG: [-20, -35, -50, -60],

  // Chứng khoán (beta cao)
  SSI: [-35, -50, -60, -65],
  VND: [-35, -50, -60, -65],

  // Ngân hàng (chu kỳ vừa)
  TPB: [-25, -40, -50, -55],
  VPB: [-25, -40, -50, -55],
  TCB: [-25, -40, -50, -55],

  // Hạ tầng – tiện ích (ổn định hơn, kích hoạt sớm hơn)
  REE: [-15, -25, -35, -45],
};
