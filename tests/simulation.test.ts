describe('Simulation Logic', () => {
  it('should calculate load correctly', () => {
    const throughput = 10;
    const capacity = 5;
    const load = throughput / capacity;
    expect(load).toBe(2);
    expect(load > 0.8).toBe(true); // Overloaded
  });

  it('should handle zero throughput gracefully', () => {
    const throughput = 0;
    const capacity = 5;
    const load = throughput / capacity;
    expect(load).toBe(0);
    expect(load > 0.8).toBe(false);
  });
});
